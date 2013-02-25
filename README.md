# level-couch-sync

synchronize couchdb data into leveldb.

## example

``` js
var levelCouchSync = require('level-couch-sync')

levelCouchSync(db, {
  map: function (data, emit) {
    //emit the data you want to save in the leveldb
    emit(data.id, JSON.stringify(data.doc))
  },
  //set dry to true, so not write to the db
  //dry: false
})
.on('progress', function (ratio) {
  console.log(ratio) //the ratio that it's finished!
  //when it gets to 100 you are just getting the live changes!
})
```

also see npm example


# License

MIT

