'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var inflection = require('inflection');
var OddCatalogError = require('../lib/odd-catalog-error');

module.exports = function (plugin, options, seneca) {
	//  delete liveStream
	//  catalog: catalog/liveStream
	//  provides: catalog/liveStream
	function related(args, done) {
		var senecaLocal = this;
		var act = Promise.promisify(senecaLocal.act, senecaLocal);
		var depth;
		var entities;
		var relatedEntities;
		var extendedArgs = {};

		if (args.organization && args.device) {
			extendedArgs.organization = args.organization;
			extendedArgs.device = args.device;
		}

		if (args.user) {
			extendedArgs.user = args.user;
		}

		// If we gave neither an entity or an array of entities, return
		if (!_.isObject(args.entity) && !_.isObject(args.entities)) {
			return done(null, null);
		}
		entities = args.entities || [];
		entities = entities.concat([args.entity]);
		entities = _.compact(entities);

		// If depth is not a valid integer, return
		if ((!_.isNumber(args.depth) || args.depth <= 0) && !_.isString(args.include)) {
			return done(null, null);
		}
		depth = args.depth || 1;
		depth = (depth > 0) ? depth - 1 : depth;

		// This ball of crazy pulls all of the data properties from each
		// item, within each relationship.
		relatedEntities = _(entities).map('relationships')
			.map(!args.include || args.include === true ? _.values : function (value) {
				if (!value) {
					return undefined;
				}

				var ret = [];

				_.each(args.include.split(','), function eachIncludedScope(scope) {
					if (value[scope]) {
						ret[scope] = value[scope];
					}
				});

				return _.values(ret);
			})
			.flattenDeep()
			.map('data')
			.flattenDeep()
			.remove(undefined)
			.value()
		;

		if (!_.isArray(relatedEntities)) {
			return done(null, null);
		}

		Promise.all(_.map(relatedEntities, function (entity) {
			var cmd;

			// Figure out which command we're going to call
			cmd = 'fetch_' + inflection.underscore(entity.type);
			cmd = inflection.camelize(cmd, true);
			cmd = inflection.singularize(cmd);
			return act(_.assign({role: 'catalog', cmd: cmd, id: entity.id}, extendedArgs));
		})).then(function (entities) {
			var e;
			entities = _.compact(entities);
			if (entities.length !== relatedEntities.length) {
				e = new OddCatalogError('Could not find included entity');
				e.code = 'NOT_FOUND';
				throw e;
			}
			if (depth === 0 || entities.length === 0) {
				return _(entities).uniqBy('id').value();
			}
			return act(_.assign({role: 'catalog', cmd: 'related', entities: entities, depth: depth}, extendedArgs))
				.then(function (results) {
					return _(entities.concat(results)).uniqBy('id').value();
				});
		}).nodeify(done);
	}

	seneca.add({role: plugin, cmd: 'related'}, related);
};
