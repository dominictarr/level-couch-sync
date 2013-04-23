// Dependencies
var levelCouchSync = require('../')
var levelup = require('levelup')
var sublevel = require('level-sublevel')
var os = require('os')

// Create a level-sublevel instance to store the documents
var db = sublevel(levelup(os.tmpdir() + '/level-npm-basic'))

// The sync. Since no callback has been given, this will sync all documents
// and store them as (key, value) == (data.id, JSON.stringify(data.doc)
levelCouchSync('http://isaacs.iriscouch.com/registry', db, 'registry-sync')

