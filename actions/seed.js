'use strict';

var glob = require('glob');
var inflection = require('inflection');
var _ = require('lodash');
var path = require('path');
var ejs = require('elastic.js');
var Promise = require('bluebird');

module.exports = function (plugin, options, seneca, elasticClient) {
	var allOptions = seneca.options();
	var index = _.get(allOptions, 'elasticsearch.index');

	function flushES(args, done) {
		/* eslint-disable */
		var query = ejs.QueryStringQuery('*');
		var body = JSON.parse(ejs
			.Request()
			.query(query)
			.toString());
		/* eslint-enable */

		elasticClient.deleteByQuery({
			index: index,
			body: body
		}, function () {
			done(null);
		});
	}

	// Seed
	function seed(args, done) {
		var globber = Promise.promisify(glob);
		var act = Promise.promisify(seneca.act, seneca);

		globber('../test/seed/**/*.json', {cwd: __dirname})
			.then(function (files) {
				return _.map(files, function (file) {
					/* eslint-disable */
					return require(path.join(__dirname, file));
					/* eslint-enable */
				});
			})
			.then(function (entities) {
				return Promise.all(
					_.map(entities, function (entity) {
						var entityType = inflection.underscore(entity.type);
						var cmd = inflection.camelize('create_' + entityType, true);
						return act(_.extend({role: 'catalog', cmd: cmd}, entity));
					})
				);
			})
			.nodeify(done);
	}

	function indexES(args, done) {
		var globber = Promise.promisify(glob);

		globber('../test/seed/catalog_+(collection|video*)/*.json', {cwd: __dirname})
			.then(function (files) {
				return _.map(files, function (file) {
					/* eslint-disable */
					return require(path.join(__dirname, file));
					/* eslint-enable */
				});
			})
			.then(function (entities) {
				return Promise.all(
					_.map(entities, function (entity) {
						return elasticClient.index({
							index: index,
							type: entity.type,
							id: entity.id,
							body: {
								title: entity.title,
								description: entity.description,
								organization: entity.organization
							}
						});
					})
				);
			})
			.then(function (results) {
				setTimeout(function () {
					done(null, results);
				}, 1000);
			});
	}

	// Only add the flush action if we're it was requested.	It can blow shit up.
	if (options.enableFlush) {
		seneca.add({role: plugin, cmd: 'flush_es'}, flushES);
		seneca.add({role: plugin, cmd: 'index_es'}, indexES);
	}

	seneca.add({role: plugin, cmd: 'seed'}, seed);
};
