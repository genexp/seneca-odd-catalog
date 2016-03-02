'use strict';

var _ = require('lodash');
var Promise = require('bluebird');

var DataStore = require('../lib/data-store');

module.exports = function (plugin, options, seneca) {
	var store = new DataStore();
	var act = Promise.promisify(seneca.act, seneca);
	var entity = seneca.make('catalog/collection');

	var videoEntity = seneca.make('catalog/video');
	videoEntity.loadAsync = Promise.promisify(videoEntity.load$, videoEntity);

	store.init({seneca: seneca, entity: entity});

	seneca.add({role: plugin, cmd: 'fetchCollection'}, store.fetchEntity);
	seneca.add({role: plugin, cmd: 'fetchCollections'}, store.fetchEntities);
	seneca.add({role: plugin, cmd: 'createCollection'}, createCollection);
	seneca.add({role: plugin, cmd: 'upsertCollection'}, upsertCollection);
	seneca.add({role: plugin, cmd: 'deleteCollection'}, deleteEntity);
	seneca.add({role: plugin, cmd: 'upsertCollectionRelations'}, store.upsertEntityRelations);

	function upsertCollection(args, done) {
		return act({role: 'catalog', cmd: 'addVideoRelationships', relationships: args.relationships})
			.then(function callUpsert() {
				store.upsertEntity(args, done);
			})
		;
	}

	function createCollection(args, done) {
		return act({role: 'catalog', cmd: 'addVideoRelationships', relationships: args.relationships})
			.then(function callCreate() {
				store.createEntity(args, done);
			})
		;
	}

	function deleteEntity(args, done) {
		return Promise.join(
				act('role: catalog, cmd: fetchCollections'),
				act('role: catalog, cmd: fetchViews')
			)
			.then(function (results) {
				var updates = [];

				_.each(results[0], function (entity) {
					var entityData = entity.data$();
					if (entityData.relationships && entityData.relationships.videoCollections) {
						_.remove(entityData.relationships.videoCollections.data, function (relationship) {
							return (relationship.type === 'collection' && relationship.id === args.id);
						});

						delete entityData.entity$;

						updates.push(act('role: catalog, cmd: upsertCollection', entityData));
					}
				});

				_.each(results[1], function (entity) {
					var entityData = entity.data$();
					if (entityData.relationships) {
						_.forOwn(entityData.relationships, function (hash, relationshipType) {
							_.remove(entityData.relationships[relationshipType].data, function (relationship) {
								return (relationship.type === 'collection' && relationship.id === args.id);
							});
						});

						delete entityData.entity$;

						updates.push(act('role: catalog, cmd: upsertView', entityData));
					}
				});

				return Promise.all(updates);
			})
			.then(function () {
				store.deleteEntity(args, function (err) {
					if (err) {
						return Promise.reject(err);
					}

					return Promise.resolve();
				});
			})
			.catch(function (err) {
				done(err);
			})
			.nodeify(done);
	}
};
