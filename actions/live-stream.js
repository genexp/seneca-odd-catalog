'use strict';

var DataStore = require('../lib/data-store');
var addVideoFeatures = require('../lib/add-video-features');

module.exports = function (plugin, options, seneca) {
	var store = new DataStore();
	var entity = seneca.make('catalog/liveStream');
	store.init({seneca: seneca, entity: entity});

	seneca.add({role: plugin, cmd: 'fetchLiveStream'}, fetchLiveStream);
	seneca.add({role: plugin, cmd: 'fetchLiveStreams'}, store.fetchEntities);
	seneca.add({role: plugin, cmd: 'createLiveStream'}, store.createEntity);
	seneca.add({role: plugin, cmd: 'upsertLiveStream'}, store.upsertEntity);
	seneca.add({role: plugin, cmd: 'deleteLiveStream'}, store.deleteEntity);

	function fetchLiveStream(args, done) {
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
};
