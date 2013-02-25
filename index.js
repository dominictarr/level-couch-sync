var request    = require('request')
var follow     = require('follow')
var EventEmitter = require('events').EventEmitter

module.exports = function (db, opts) {
  var emitter = new EventEmitter
  var seq = 0
  var url    = opts.url
  var map = opts.map || function (e, emit) {
    emit(e.id, JSON.stringify(e.doc))
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
      emitter.emit('data', data)
      emitter.emit('progress', seq / maxSeq)
    })
  })

  return emitter
}


