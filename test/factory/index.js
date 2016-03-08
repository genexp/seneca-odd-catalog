'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var uuid = require('uuid');
var v1 = uuid.v1;
var v4 = uuid.v4;
var _baseVideo = require('./structures/video.json');
var _baseCollection = require('./structures/collection.json');
var seneca = require('../seneca_helper');
var schemas = require('@oddnetworks/odd-schemas');
var dg = schemas.newDataGenerator(schemas.loadSchemas());

function _createEntity(obj, opts) {
	var ret = _.cloneDeep(obj);

	_.extend(ret, opts);
	ret.id = v1();

	return ret;
}

exports.video = function createCatalogVideo(opts) {
	var ret = _createEntity(_baseVideo, opts);

	return ret;
};

exports.upsertVideo = function upsertVideoEntity(opts) {
	return seneca.actAsync(_.extend(exports.video(opts), {role: 'catalog', cmd: 'upsertVideo'}));
};

exports.collection = function createCatalogCollection(opts) {
	var ret = _createEntity(_baseCollection, opts);

	return ret;
};

exports.relationships = function createRelationships(entities) {
	var relationships = {entities: {data: []}};

	_.each(entities, function addEachId(entity) {
		relationships.entities.data.push({id: entity.id, type: entity.type});
	});

	return relationships;
};

function _collectionWithVideos(type, count) {
	count = count || 3;
	var collection = dg['generate' + type]();
	var promises = [];
	var ret = {videos: [], collection: {}};
	var org = null;

	collection.relationships = {entities: {data: []}};
	_.each(_.range(0, count), function createEachVideo() {
		var video = dg.generateVideo();
		video.id = v4();

		if (!org) {
			org = video.organization;
		}
		video.organization = org;

		collection.relationships.entities.data.push({id: video.id, type: 'video'});
		promises.push(seneca.actAsync(_.extend(video, {role: 'catalog', cmd: 'upsertVideo'})));
	});

	return Promise.all(promises)
		.then(function createCollection(videos) {
			ret.videos = videos;

			return seneca.actAsync(_.extend(collection, {role: 'catalog', cmd: 'upsertCollection'}));
		})
		.then(function reloadVideos(collection) {
			ret.collection = collection;

			var promises = [];

			_.map(ret.videos, function (video) {
				promises.push(Promise.promisify(video.load$, video)(video.id));
			});

			return Promise.all(promises);
		})
		.then(function returnData(videos) {
			ret.videos = videos;

			return ret;
		})
	;
}

exports.collectionWithVideos = function createCollectionWithVideos(count) {
	return _collectionWithVideos('Collection', count);
};

exports.videoCollectionWithVideos = function createVideoCollectionWithVideos(count) {
	return _collectionWithVideos('VideoCollection', count);
};
