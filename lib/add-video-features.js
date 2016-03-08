var _ = require('lodash');
var interpolate = require('interpolate');

module.exports = function addVideoFeatures(video, organization, device) {
	if (organization && device) {
		var featureKeys = [
			{featureKey: 'ads', interpolateKey: 'url'},
			{featureKey: 'overlays'},
			{featureKey: 'player'},
			{featureKey: 'sharing', interpolateKey: 'text'}
		];

		_.each(featureKeys, function (featureKey) {
			var key = featureKey.featureKey;
			var interpolateKey = featureKey.interpolateKey;

			if (!_.has(organization, 'features.' + key)) {
				_.set(organization, 'features.' + key, {});
			}

			if (!_.has(device, 'features.' + key)) {
				_.set(device, 'features.' + key, {});
			}

			if (!_.has(video, key)) {
				_.set(video, key, {});
			}

			video[key] = _.merge({}, organization.features[key], device.features[key], video[key]);

			if (interpolateKey && _.has(video, key + '.' + interpolateKey)) {
				var interpolatedKey = key + '.' + interpolateKey;
				var interpolatedValue = interpolate(_.get(video, interpolatedKey), video);

				_.set(video, interpolatedKey, interpolatedValue);
			}
		});

		if (_.has(video, 'ads')) {
			video.ads.assetId = _.get(video, 'meta.sourceId') || video.id;
		}

		if (_.has(video, 'player')) {
			switch (video.player.type) {
				case 'ooyala':
					video.player.embedCode = _.get(video, 'meta.sourceId') || video.id;
					break;
				default:
					// no-op
					break;
			}
		}
	}

	return video;
};
