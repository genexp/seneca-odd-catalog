'use strict';

var _ = require('lodash');
var v1 = require('uuid').v1;
var _baseVideo = require('./structures/video.json');
var _baseCollection = require('./structures/collection.json');
var seneca = require('../seneca_helper');

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
