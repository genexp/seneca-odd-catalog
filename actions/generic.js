'use strict';

var inflection = require('inflection');

var DataStore = require('../lib/data-store');

module.exports = function (plugin, options, entityType, seneca) {
	var store = new DataStore();

	var entity = inflection.camelize(entityType.replace('-', '_'), true);
	entity = seneca.make('catalog/' + entity);
	store.init({seneca: seneca, entity: entity});

	var entityCmd = inflection.camelize(entityType.replace('-', '_'));

	seneca.add({role: plugin, cmd: 'fetch' + entityCmd}, store.fetchEntity);
	seneca.add({role: plugin, cmd: 'fetch' + inflection.pluralize(entityCmd)}, store.fetchEntities);
	seneca.add({role: plugin, cmd: 'create' + entityCmd}, store.createEntity);
	seneca.add({role: plugin, cmd: 'upsert' + entityCmd}, store.upsertEntity);
	seneca.add({role: plugin, cmd: 'delete' + entityCmd}, store.deleteEntity);
};
