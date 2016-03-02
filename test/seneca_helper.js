'use strict';

var config = require('./config');
var seneca = require('seneca')(config);
var catalog = require('..');
var Promise = require('bluebird');

seneca.use('mem-store');

seneca.use({init: catalog, name: 'catalog'});
seneca.actAsync = Promise.promisify(seneca.act, seneca);

module.exports = seneca;
