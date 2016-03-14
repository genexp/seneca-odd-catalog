'use strict';

var _ = require('lodash');
var Promise = require('bluebird');

var DataStore = require('../lib/data-store');

module.exports = function (plugin, options, seneca) {
	var store = new DataStore();
	var entity = seneca.make('catalog/collection');

	var videoEntity = seneca.make('catalog/video');
	videoEntity.loadAsync = Promise.promisify(videoEntity.load$, videoEntity);

	store.init({seneca: seneca, entity: entity});

	seneca.add({role: plugin, cmd: 'addVideoRelationships'}, addVideoRelationships);

	function addVideoRelationships(args, done) {
		if (!_.get(args, 'relationships.entities.data')) {
			return done(null, {});
		}

		var promises = [];

		_.each(args.relationships.entities.data, function loadEachVideoInCollection(data) {
			if (_.get(data, 'type') === 'video') {
				promises.push(videoEntity.loadAsync(data.id));
			}
		});

		return Promise.all(promises)
			.then(function addRelatedVideos(videos) {
				var promises = [];
				videos = _.compact(videos);

				for (var x = 0; x < videos.length; x++) {
					var video = videos[x];

					if (!video || _.get(video, 'relationships.related')) {
						continue;
					}

					if (!video.relationships) {
						video.relationships = {};
					}
					video.relationships.related = {data: []};

					for (var y = 0; y < videos.length; y++) {
						if (x !== y) {
							video.relationships.related.data.push({id: videos[y].id, type: 'video'});
						}
					}

					promises.push(Promise.promisify(video.save$, video)());
				}

				return Promise.all(promises);
			})
			.nodeify(done);
	}
};
