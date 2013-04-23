// Dependencies
var levelCouchSync = require('../')
var levelup = require('levelup')
var sublevel = require('level-sublevel')

// Create a level-sublevel instance to store
var db = sublevel(levelup(process.env.HOME + '/.level-npm-basic'))

// The sync. Since no callback has been given, this will sync all documents
// and store them as (key, value) == (data.id, JSON.stringify(data.doc)
levelCouchSync('http://isaacs.iriscouch.com/registry', db, 'registry-sync')

