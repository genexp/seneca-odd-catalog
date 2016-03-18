'use strict';

var lruCache = require('lru-cache');
var _ = require('lodash');
var Promise = require('bluebird');
var userEntitlements = require('../lib/user-entitlements');

var DataStore = require('../lib/data-store');

module.exports = function (plugin, options, seneca) {
	var cache = lruCache(options.lruCache);
	var store = new DataStore();
	var act = Promise.promisify(seneca.act, seneca);
	var entity = seneca.make('catalog/view');

	store.init({seneca: seneca, entity: entity});

	seneca.add({role: plugin, cmd: 'fetchView'}, fetchView);
	seneca.add({role: plugin, cmd: 'fetchViews'}, store.fetchEntities);
	seneca.add({role: plugin, cmd: 'createView'}, store.createEntity);
	seneca.add({role: plugin, cmd: 'upsertView'}, store.upsertEntity);
	seneca.add({role: plugin, cmd: 'deleteView'}, store.deleteEntity);

	function fetchView(args, done) {
		var depth = args.depth || 1;
		var key = [args.id, depth].join(':');

		// Pull the view from cache
		var view = cache.get(key);
		if (view) {
			seneca.log.info('view:cache', 'hit', key);

			// If fetchView was supplied a user then decoracte the includes with entitlements
			if (args.user) {
				view.included = _.map(view.included, function (entity) {
					return userEntitlements(entity, args.user);
				});
			}
			done(null, view);
		} else {
			// If the view was not in the cache, load it from the db
			entity.load$(args.id, function (err, view) {
				if (err) {
					return done(err);
				}

				if (view) {
					seneca.log.info('view:cache', 'miss', key);

					// Always fetch related for views with at least depth 1
					act({role: 'catalog', cmd: 'related', entity: view, depth: depth})
						.then(function (related) {
							// Attach the included entities to the view and cache it without decorated user entitlements
							view.included = related;
							cache.set(key, view);
							seneca.log.info('view:cache', 'set', key);

							// If fetchView was supplied a user then decoracte the includes with entitlements
							if (args.user) {
								view.included = _.map(view.included, function (entity) {
									return userEntitlements(entity, args.user);
								});
							}
							done(null, view);
						});
				} else {
					done(null, null);
				}
			});
		}
	}
};
