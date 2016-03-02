'use strict';

var _ = require('lodash');
var elasticsearch = require('elasticsearch');
var awsConnector = require('./lib/aws-es-http-connector');
var inflection = require('inflection');
var deleteByQuery = require('elasticsearch-deletebyquery');

module.exports = function (options) {
	var seneca = this;
	var plugin = 'catalog';
	var genericEntities = ['promotion', 'query', 'view', 'article', 'event', 'external'];
	var specialEntities = ['live-stream', 'video', 'collection'];
	var senecaEntityMap;

	// ElasticSearch Entities
	// Some fancy options overriding:
	//	 http://senecajs.org/write-a-plugin.html#wp-options
	// Allows us flexibility in prod vs. test
	var elasticOptions = seneca.util.deepextend({
		fetchEntitiesFromDB: false,
		suggestCompression: true,
		refreshOnSave: false,
		pingTimeout: 5000,
		index: plugin,
		plugins: [deleteByQuery],
		connectionClass: _.isEmpty(this.options().elasticsearch.creds) ? 'http' : awsConnector(this.options().elasticsearch)
	}, this.options().elasticsearch);

	var elasticClient = new elasticsearch.Client(elasticOptions);

	// Plugins
	// seneca.depends(plugin, ['elasticsearch']);

	/* eslint-disable */
	// Actions
	require('./actions/init.js')(plugin, options, seneca, elasticClient);
	require('./actions/related.js')(plugin, options, seneca);
	require('./actions/search.js')(plugin, options, seneca, elasticClient);
	require('./actions/seed.js')(plugin, options, seneca, elasticClient);
	require('./actions/relationships.js')(plugin, options, seneca);
	/* eslint-enable */

	_.each(genericEntities, function (entity) {
		require('./actions/generic.js')(plugin, options, entity, seneca);
	});

	_.each(specialEntities, function (entity) {
		require('./actions/' + entity + '.js')(plugin, options, seneca);
	});

	// Seneca Entities
	senecaEntityMap = _(genericEntities.concat(specialEntities)).map(function (entity) {
		entity = inflection.camelize(entity.replace('-', '_'), true);
		return [entity, seneca.make('catalog/' + entity)];
	}).zipObject().value();

	seneca.act({
		role: 'util',
		cmd: 'ensure_entity',
		pin: {role: plugin, cmd: '*'},
		entmap: senecaEntityMap
	});

	// Done!
	return {name: plugin};
};
