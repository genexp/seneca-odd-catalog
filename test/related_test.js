'use strict';

// Nuke any existing log files
var test	 = require('tape');
var seneca = require('./seneca_helper');
var pin		= seneca.pin({role: 'catalog', cmd: '*'});
var async	= require('async');

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
