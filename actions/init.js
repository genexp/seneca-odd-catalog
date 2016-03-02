'use strict';

var _ = require('lodash');

module.exports = function init(plugin, options, seneca, elasticClient) {
	var allOptions = seneca.options();
	var catalog = _.get(allOptions, 'elasticsearch.index');
	var client = elasticClient;

	seneca.add({init: plugin}, function (args, done) {
		client.indices.create({
			index: catalog
		}, function (err) {
			if (err && /index.?already.?exists.?exception/im.test(err.message)) {
				done(null, {ok: false});
			} else {
				done(err, {ok: !err});
			}
		});
	});
};
