var levelCouchSync = require('./')
var bucket = require('range-bucket')

if(!module.parent) {
  var b = bucket('npm')
  levelCouchSync(require('levelup')(process.env.HOME + '/.level-npm'), {
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
  })
  .on('data', function (data) {
    console.log(data.id)
  })
  .on('progress', function (ratio) {
    console.log(Math.floor(ratio*10000)/100)
  })
}

