

var request    = require('request')
var JSONStream = require('JSONStream')
var through    = require('through')
var follow     = require('follow')
var bucket     = require('range-bucket')
var EventEmitter = require('events').EventEmitter

module.exports = function (db, opts) {
  var emitter = new EventEmitter
  var seq = 0
  var url    = opts.url
  var map = opts.map || function (e) {
    console.log(e)
  }
  var prefix = opts.prefix || ''
  var maxSeq
  request.get(opts.db, function (err, _, body) {
    var data = JSON.parse(body)
    maxSeq = data.update_seq
  })

  db.get(prefix + '\xFFSEQ', function (err, val) {

    seq = Number(val) || 0, percent = 0

    var ws = db.writeStream()

    follow({db: opts.db, include_docs: true, since: seq}, function (err, data) {
      if(err) return
      
      var push = [], _seq = seq, done = false
      map(data, function (key, val) {
        if(done) throw new Error('map must not be async')
        push.push({key: prefix+key, value: val})
      })

      if(data.seq > seq) seq = data.seq
      push.push({key: prefix+'\xFFSEQ', value: seq})

      done = true
      if(!opts.dry)
        while(push.length)
          ws.write(push.shift())
      emitter.emit('progress', seq / maxSeq)
    })
  })

  return emitter
}


if(!module.parent) {
  var b = bucket('npm')
  module.exports(require('levelup')(process.env.HOME + '/.level-npm'), {
    db: 'http://isaacs.iriscouch.com/registry',
    map: function (data, emit) {
      var doc = data.doc

      //don't allow keys with ~
      if(/~/.test(data.id)) return
      emit(b('package', data.id), JSON.stringify({
        name        : doc.name,
        description : doc.keywords,
        readme      : doc.readme,
        keywords    : doc.keywords,
        author      : doc.author,
        licenses    : doc.licenses,
        repository  : doc.repository
      }))

      //versions
      var vers = data.versions
      for(var version in vers) {
        var ver = vers[version]
        emit(b('version', [data.id, version]), JSON.stringify({
          name: ver.name,
          version: ver.version,
          dependencies: ver.dependencies,
          devDependencies: ver.devDependencies,
          description: ver.description
        }))
      }

    },
//    dry: true
  })
  .on('data', function (data) {
    console.log(data.id)
  })
  .on('progress', function (ratio) {
    console.log(Math.floor(ratio*10000)/100)
  })

}

/*
module.exports = function (url, filter, db) {

request.get('http://isaacs.iriscouch.com/registry/_all_docs?include_docs=true&update_seq='+seq)
  .once('data', function (d) {
    console.log(''+d)
  })
  .pipe(JSONStream.parse(['rows', true, 'doc']))
  .on('data', console.log)
  .pipe(through(function (data) {
    var self = this
    filter(data, function (key, value) {
      self.queue(key, value)
    })
  })

}*/
