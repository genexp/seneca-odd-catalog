'use strict';

// Nuke any existing log files
var _ = require('lodash');
var test	 = require('tape');
var seneca = require('./seneca_helper');
var pin		= seneca.pin({role: 'catalog', cmd: '*'});
var async	= require('async');
var factory = require('./factory');

var before = test;

before('before all tests', function (t) {
	async.series([
		seneca.next_act('role:catalog,cmd:seed')
	], t.end);
});

test('A view can fetch included with depth = 0', function (t) {
	t.plan(1);

	pin.fetchView({id: '2a181af0-eea5-4a11-8c5a-3c2d146657d7'}, function (fetchErr, fetchedEntity) {
		pin.related({entity: fetchedEntity, depth: 0}, function (err, out) {
			t.equal(out, null);
			t.end(err);
		});
	});
});

test('A view can fetch included with depth = 1', function (t) {
	t.plan(1);

	pin.fetchView({id: '2a181af0-eea5-4a11-8c5a-3c2d146657d7'}, function (fetchErr, fetchedEntity) {
		pin.related({entity: fetchedEntity, depth: 1}, function (err, out) {
			t.equal(out.length, 6);
			t.end(err);
		});
	});
});

test('A view can fetch included with depth = 2', function (t) {
	t.plan(1);

	pin.fetchView({id: '2a181af0-eea5-4a11-8c5a-3c2d146657d7'}, function (fetchErr, fetchedEntity) {
		pin.related({entity: fetchedEntity, depth: 2}, function (err, out) {
			t.equal(out.length, 6);
			t.end(err);
		});
	});
});

test('A view can fetch included with depth = 3', function (t) {
	t.plan(1);

	pin.fetchView({id: '2a181af0-eea5-4a11-8c5a-3c2d146657d7'}, function (fetchErr, fetchedEntity) {
		pin.related({entity: fetchedEntity, depth: 3}, function (err, out) {
			t.equal(out.length, 6);
			t.end(err);
		});
	});
});

test('related: include=related on a collection with 2 videos', function (t) {
	t.plan(8);
	var collection = {};
	var videos = [];

	return factory.collectionWithVideos()
		.then(function (res) {
			videos = res.videos;
			collection = res.collection;

			t.ok(collection, 'create collection');
			t.ok(_.get(collection, 'relationships.entities.data'), 'collection should have relationships');
			t.ok(videos, 'create videos in the collection');
			t.ok(videos.length > 1, 'create at least 2 videos so relationships are created');
			t.ok(_.get(videos, '[0].relationships.related.data[0]'), 'created the related videos data');

			return seneca.actAsync({role: 'catalog', cmd: 'related', entity: videos[0], include: 'related'});
		})
		.then(function testResults(res) {
			t.ok(res, 'got results');
			t.equal(res.length, 2, 'only has 2 results');
			t.notOk(_.find(res, {id: videos[0].id}), 'does not include itself');
		})
		.catch(function (e) {
			console.log(e);
		})
		.finally(function endTest() {
			t.end();
		})
	;
});

test('related: include=related,entities on a collection without entities', function (t) {
	t.plan(8);
	var collection = {};
	var videos = [];

	return factory.collectionWithVideos()
		.then(function (res) {
			videos = res.videos;
			collection = res.collection;

			t.ok(collection, 'create collection');
			t.ok(_.get(collection, 'relationships.entities.data'), 'collection should have relationships');
			t.ok(videos, 'create videos in the collection');
			t.ok(videos.length > 1, 'create at least 2 videos so relationships are created');
			t.ok(_.get(videos, '[0].relationships.related.data[0]'), 'created the related videos data');

			return seneca.actAsync({role: 'catalog', cmd: 'related', entity: videos[0], include: 'related,entities'});
		})
		.then(function testResults(res) {
			t.ok(res, 'got results');
			t.equal(res.length, 2, 'only has 2 results');
			t.notOk(_.find(res, {id: videos[0].id}), 'does not include itself');
		})
		.catch(function (e) {
			console.log(e);
		})
		.finally(function endTest() {
			t.end();
		})
	;
});

test('related: include=entities on a collection without entities', function (t) {
	t.plan(7);
	var collection = {};
	var videos = [];

	return factory.collectionWithVideos()
		.then(function (res) {
			videos = res.videos;
			collection = res.collection;

			t.ok(collection, 'create collection');
			t.ok(_.get(collection, 'relationships.entities.data'), 'collection should have relationships');
			t.ok(videos, 'create videos in the collection');
			t.ok(videos.length > 1, 'create at least 2 videos so relationships are created');
			t.ok(_.get(videos, '[0].relationships.related.data[0]'), 'created the related videos data');

			return seneca.actAsync({role: 'catalog', cmd: 'related', entity: videos[0], include: 'entities'});
		})
		.then(function testResults(res) {
			t.ok(res, 'got results');
			t.equal(res.length, 0, 'has no results');
		})
		.catch(function (e) {
			console.log(e);
		})
		.finally(function endTest() {
			t.end();
		})
	;
});

test('related: depth=true on a videoCollection with data', function (t) {
	t.plan(7);
	var collection = {};
	var videos = [];

	return factory.videoCollectionWithVideos()
		.then(function (res) {
			videos = res.videos;
			collection = res.collection;

			t.ok(collection, 'create collection');
			t.ok(_.get(collection, 'relationships.entities.data'), 'collection should have relationships');
			t.ok(videos, 'create videos in the collection');
			t.ok(videos.length > 1, 'create at least 2 videos so relationships are created');
			t.ok(_.get(videos, '[0].relationships.related.data[0]'), 'created the related videos data');

			return seneca.actAsync({role: 'catalog', cmd: 'related', entity: collection, include: true, depth: 2});
		})
		.then(function testResults(res) {
			t.ok(res, 'got results');
			t.equal(res.length, 3, 'has only the number of entities in the collection');
		})
		.catch(function (e) {
			console.log(e);
		})
		.finally(function endTest() {
			t.end();
		})
	;
});
