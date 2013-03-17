var levelCouchSync = require('./')
var pad = require('padded-semver').pad

if(!module.parent) {
  var db = require('level-sublevel')(require('levelup')(process.env.HOME + '/.level-npm'))
  var packageDb = db.sublevel('package')
  var versionDb = db.sublevel('version')
  levelCouchSync('http://isaacs.iriscouch.com/registry', db, 'registry-sync', 
    function (data, emit) {
      var doc = data.doc

      //don't allow keys with ~
      if(/~/.test(data.id)) return
      emit(data.id, JSON.stringify({
        name        : doc.name,
        description : doc.keywords,
        readme      : doc.readme,
        keywords    : doc.keywords,
        author      : doc.author,
        licenses    : doc.licenses,
        repository  : doc.repository
      }), packageDb)

      //versions
      var vers = doc.versions
      for(var version in vers) {
        var ver = vers[version]
        emit(data.id + '\xFF' + pad(version), JSON.stringify({
          name: ver.name,
          version: ver.version,
          dependencies: ver.dependencies,
          devDependencies: ver.devDependencies,
          description: ver.description
        }), versionDb)
      }
    })
    .on('data', function (data) {
      console.log(data.id, data.doc.versions && Object.keys(data.doc.versions))
    })
    .on('progress', function (ratio) {
      console.log(Math.floor(ratio*10000)/100)
    })
}

