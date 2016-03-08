'use strict';
var _ = require('lodash');
var ejs = require('elastic.js');
var Promise = require('bluebird');

module.exports = function (plugin, options, seneca, elasticClient) {
	//	search entities
	//	catalog: catalog/search
	//	provides: catalog/entity

	var allOptions = seneca.options();
	var catalog = _.get(allOptions, 'elasticsearch.index');

	seneca.add({role: plugin, cmd: 'search'}, function (args, done) {
		var act = Promise.promisify(seneca.act, seneca);
		var term = args.term;
		var limit = args.limit || 10;
		var offset = args.offset || 0;
		var entityTypes = args.entityTypes || ['video', 'collection'];

		// Build Query
		var query = ejs
			/* eslint-disable */
			.MultiMatchQuery(['title', 'description'], term)
			/* eslint-enable */
			.type('phrase_prefix')
			.operator('and');

		// Filter by org also if supplied
		if (args.organization) {
			query = ejs
				/* eslint-disable */
				.BoolQuery()
				/* eslint-enable */
				.must(query)
				.must(
					/* eslint-disable */
					ejs.MatchQuery('organization', args.organization.id)
					/* eslint-enable */
				);
		}

		var body = ejs
			/* eslint-disable */
			.Request()
			/* eslint-enable */
			.query(query)
			.from(offset)
			.size(limit)
			.toString();

		var searchArgs = {
			index: catalog,
			type: entityTypes.join(','),
			body: body
		};

		var total = 0;

		elasticClient.search(searchArgs)
			.then(function (response) {
				total = response.hits.total;
				return Promise.settle(_.map(response.hits.hits, function (result) {
					var entity = seneca.make$(result._type);
					var action = 'fetch' + _.upperFirst(entity.canon$({object: true}).name);
					var cmd = {
						role: 'catalog',
						cmd: action,
						id: result._id
					};

					if (args.organization && args.device) {
						cmd.organization = args.organization;
						cmd.device = args.device;
					}

					if (args.user) {
						cmd.user = args.user;
					}

					return act(cmd);
				}))
				.then(function (results) {
					var formattedResults = [];

					_.each(results, function (result) {
						if (result.isFulfilled()) {
							var val = result.value();
							formattedResults.push(val);
						} else {
							console.error(result.reason());
						}
					});
					return Promise.resolve(formattedResults);
				});
			})
			.then(function (results) {
				var data = {
					data: _.compact(results),
					meta: {
						term: term,
						limit: limit,
						offset: offset,
						total: total,
						entityTypes: entityTypes
					}
				};

				done(null, data);
			});
	});
};
