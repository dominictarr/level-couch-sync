var request    = require('request')
var follow     = require('follow')
var EventEmitter = require('events').EventEmitter

module.exports = function (sourceUrl, db, metaDb, map) {
  if (!metaDb || 'function' === typeof metaDb)
    throw new Error('meta db *must* be a string or a level-sublevel instance')

  var emitter = new EventEmitter
  var seq = 0
  var map = map || function (e, emit) {
    emit(e.id, JSON.stringify(e.doc))
  }
  var maxSeq

  if('string' === typeof metaDb)
    metaDb = db.sublevel(metaDb)

  request.get(sourceUrl, function (err, _, body) {
    var data = JSON.parse(body)
    maxSeq = data.update_seq
    emitter.maxSeq = maxSeq
    emitter.emit('max', maxSeq)
    if(seq)
      emitter.emit('progress', seq / maxSeq)
  })

  metaDb.get('update_seq', function (err, val) {

    var seq = Number(val) || 0, inFlight = null, queue = []

    function write() {
      if(inFlight) return
      if(!queue.length) return
      inFlight = queue
      queue = []
      var update_seq = seq
      inFlight.push({key: 'update_seq', value: seq, prefix: metaDb, type: 'put'})

      db.batch(inFlight, function (err) {
        if(err) {
          inFlight.pop() //seq
          while(inFlight.length)
            queue.unshift(inFlight.pop())
          return setTimeout(function () {
            inFlight = null
            write()
          }, 10000) //try again in a bit.
        }
        inFlight = null
        write()
        emitter.emit('progress', update_seq / maxSeq)
      })
    }

    follow({db: sourceUrl, include_docs: true, since: seq}, function (err, data) {
      if(err) return
      
      var _seq = seq, done = false

      map(data, function (key, val, prefix) {
        if(done) throw new Error('map must not be async')
        if(key.type) queue.push(key)
        else queue.push({key: key, value: val, prefix: prefix, type: 'put'})
      })

      if(data.seq > seq) seq = data.seq

      done = true
      //TODO: REWRITE TO USE batches instead of streams.

      //ADD if write is in flight, wait until it's finished before writing again.
      //if not, start a write.

      if(!inFlight) write()
      emitter.emit('data', data)
    })
  })

  return emitter
}


