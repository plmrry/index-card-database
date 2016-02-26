'use strict'

var loopback = require('loopback');
var explorer = require('loopback-component-explorer');
var Rx = require('rx');
var mongodb = require('mongodb');
const debug = require('debug');
Rx.Node = require('rx-node');

debug.enable('validate');

const stream = Rx.Observable;
var MongoClient = mongodb.MongoClient;

var app = module.exports = loopback();

app.set('host', '0.0.0.0');
app.set('port', '3000');
app.set('restApiRoot', '/api');
app.set('legacyExplorer', false);

app.middlewareFromConfig(loopback.rest, { paths: [ '/api' ], phase: 'routes' });

app.use('/explorer', explorer.routes(app, { basePath: '/api' }));

app.listen(function() {
  app.emit('started');
  console.log('Web server listening at: %s', app.get('url'));
})

app.dataSource('db', {
  "name": "db",
  "connector": "memory"
});

const mongo = app.dataSource('mongo', {
  name: 'mongo',
  connector: 'mongodb',
  database: 'index_cards_loopback'
});

//
// DEFINE MODELS
//
//

var IndexCard = app.loopback.createModel({
  name: 'IndexCard',
  strict: 'throw',
  properties: {
    mitreCard: {
      type: Object,
      required: true
    },
    nxmlId: {
      type: String,
      required: true
    }
  },
  relations: {
    nxml: {
      type: 'belongsTo',
      model: 'NXML',
      foreignKey: 'nxmlId'
    }
  },
  // acls: [
  //   {
  //     // "accessType": "*",
  //     property: "findOne",
  //     "principalType": "ROLE",
  //     "principalId": "$everyone",
  //     "permission": "DENY"
  //   }
  // ],
  indexes: {
    nxml_id_index: {
      keys: { nxmlId: 1 }
    }
  },
  idInjection: false
});

var NXML = app.loopback.createModel({
  name: 'NXML',
  strict: 'throw',
  plural: 'NXML',
  properties: {
    articleFront: {
      type: Object,
      required: true
    },
    xmlBinary: {
      type: Object,
      required: true
    }
  },
  relations: {
    indexCards: {
      type: 'hasMany',
      model: 'IndexCard',
      foreignKey: 'nxmlId'
    }
  },
  acls: [
    {
      // "accessType": "*",
      property: "WRITE",
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "DENY"
    }
  ],
  idInjection: false
});

NXML.disableRemoteMethod('deleteById', true);

app.model(NXML, { dataSource: 'mongo' });
app.model(IndexCard, { dataSource: 'mongo' });
app.model(app.loopback.User, { "dataSource": "db", "public": false });
app.model(app.loopback.AccessToken, { "dataSource": "db", "public": false });
app.model(app.loopback.ACL, { "dataSource": "db", "public": false });
app.model(app.loopback.RoleMapping, { "dataSource": "db", "public": false });
app.model(app.loopback.Role, { "dataSource": "db", "public": false });

app.enableAuth();

IndexCard
  .findOne()
  .then(function(d) {
    d.isValid(e => debug('validate')(`one card is valid`))
  });

NXML
  .findOne()
  .then(function(d) {
    d.isValid(e => debug('validate')(`one nxml is valid`))
  });
