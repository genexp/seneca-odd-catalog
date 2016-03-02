'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var addVideoFeatures = require('../lib/add-video-features');

var DataStore = require('../lib/data-store');

module.exports = function (plugin, options, seneca) {
	var store = new DataStore();
	var entity = seneca.make('catalog/video');

	store.init({seneca: seneca, entity: entity});

	seneca.add({role: plugin, cmd: 'fetchVideo'}, fetchVideo);
	seneca.add({role: plugin, cmd: 'fetchVideos'}, store.fetchEntities);
	seneca.add({role: plugin, cmd: 'createVideo'}, store.createEntity);
	seneca.add({role: plugin, cmd: 'upsertVideo'}, store.upsertEntity);
	seneca.add({role: plugin, cmd: 'deleteVideo'}, deleteVideo);

	function fetchVideo(args, done) {
		store.fetchEntity(args, function (err, video) {
			if (err) {
				return done(err);
			}

			if (video === null) {
				return done(null, null);
			}

			video = addVideoFeatures(video, args.organization, args.device);

			done(null, video);
		});
	}

	function deleteVideo(args, done) {
		var act = Promise.promisify(seneca.act, seneca);

		return Promise.join(
				act('role: catalog, cmd: fetchCollections'),
				act('role: catalog, cmd: fetchViews')
			)
			.then(function (results) {
				var updates = [];

				_.each(results[0], function (entity) {
					var entityData = entity.data$();
					if (entityData.relationships && entityData.relationships.entities) {
						_.remove(entityData.relationships.entities.data, function (relationship) {
							return (relationship.type === 'video' && relationship.id === args.id);
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
								return (relationship.type === 'video' && relationship.id === args.id);
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
