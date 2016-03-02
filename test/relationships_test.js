'use strict';

var seneca = require('./seneca_helper');
var _ = require('lodash');
var Promise = require('bluebird');
var test = require('tape');
var factory = require('./factory');

function nameTest(name) {
	return 'actions/relationships ' + name;
}

test(nameTest('seed'), function seedTest(t) {
	t.plan(1);
	var videos = [];
	var promises = [];
	var success = true;

	_.each(_.range(0, 5), function createEachVideoStructure() {
		var video = factory.video();

		videos.push(video);
		_.extend(video, {role: 'catalog', cmd: 'createVideo'});

		promises.push(seneca.actAsync(video));
	});

	return Promise.all(promises)
		.then(function createCollection() {
			var collection = factory.collection();

			collection.relationships = factory.relationships(videos);

			return seneca.actAsync(_.extend(collection, {role: 'catalog', cmd: 'createCollection'}));
		})
		.catch(function () {
			success = false;
		})
		.finally(function endTest() {
			t.ok(success, 'seed failed');
			t.end();
		})
	;
});

test(nameTest('create videos in a collection with related if multiple videos are in the collection'), function testActionSuccess(t) {
	t.plan(1);

	return seneca.actAsync({role: 'catalog', cmd: 'fetchVideos', organization: 'odd-networks'})
		.then(function (res) {
			var foundRelated = false;

			_.each(res, function findRelated(video) {
				if (!foundRelated && _.get(video, 'relationships.related.data[0]')) {
					foundRelated = true;
				}
			});

			t.ok(foundRelated);
		})
		.finally(function checkVideos() {
			t.end();
		})
	;
});
