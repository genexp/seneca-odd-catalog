'use strict';

// Nuke any existing log files
var seneca = require('./seneca_helper');
var pin = seneca.pin({role: 'catalog', cmd: '*'});
var _ = require('lodash');
var test = require('tape');
var async = require('async');

var before = test;

before('before all tests', function (t) {
	async.series([
		seneca.next_act('role:catalog,cmd:seed')
	], t.end);
});

test('A collection can be fetched', function (t) {
	t.plan(2);

	pin.fetchCollection({id: '0aa512b2-f171-42ed-99e0-32cbd35d36b7'}, function (err, collection) {
		t.equal(collection.title, 'Video Collection');
		t.ok(collection.relationships.entities);
		t.end(err);
	});
});

test('Collection relationships are created when no existing relationships present', function (t) {
	var updatedRelations = [
		{id: 1, type: 'article'},
		{id: 2, type: 'article'},
		{id: 3, type: 'article'},
		{id: 4, type: 'article'},
		{id: 8, type: 'article'}
	];

	pin.upsertCollectionRelations({id: 'b3e5110b-a3fa-4188-b36a-8bec657c60f8', key: 'articles', relations: updatedRelations}, function (err, collection) {
		if (err) {
			t.end(err);
		}
		t.ok(collection.relationships.articles);
		t.deepEqual(_.sortBy(collection.relationships.articles.data, 'id'), _.sortBy(updatedRelations, 'id'));
		t.end();
	});
});

test('Collection relationships are upserted when existing relationships are present', function (t) {
	t.plan(2);

	var originalRelations = [
		{id: 5, type: 'article'},
		{id: 6, type: 'article'},
		{id: 7, type: 'article'},
		{id: 8, type: 'article'}
	];

	var updatedRelations = [
		{id: 1, type: 'article'},
		{id: 2, type: 'article'},
		{id: 3, type: 'article'},
		{id: 4, type: 'article'},
		{id: 8, type: 'article'}
	];

	pin.fetchCollection({id: 'b3e5110b-a3fa-4188-b36a-8bec657c60f8'}, function (fetchErr, collection) {
		collection.relationships.articles = {data: originalRelations};
		collection.save$(function (saveErr) {
			pin.upsertCollectionRelations({id: 'b3e5110b-a3fa-4188-b36a-8bec657c60f8', key: 'articles', relations: updatedRelations}, function (upsertErr, collection) {
				t.ok(collection.relationships.articles);
				t.deepEqual(_.sortBy(collection.relationships.articles.data, 'id'), _.sortBy(updatedRelations, 'id'));
				t.end(fetchErr && saveErr && upsertErr);
			});
		});
	});
});
