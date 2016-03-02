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

test('A view can be fetched', function (t) {
	t.plan(2);

	pin.fetchView({id: '2a181af0-eea5-4a11-8c5a-3c2d146657d7'}, function (err, out) {
		t.equal(out.id, '2a181af0-eea5-4a11-8c5a-3c2d146657d7');
		t.equal(out.included, undefined);
		t.end(err);
	});
});

test('A view can be fetched using utter garbage as an id', function (t) {
	t.plan(1);

	pin.fetchView({id: '#$%^&*()'}, function (err, data) {
		t.equal(data, null);
		t.end(err);
	});
});

test('A view can be listed', function (t) {
	t.plan(1);

	pin.fetchViews({}, function (err, out) {
		t.ok(Array.isArray(out));
		t.end(err);
	});
});

test('A view can be created, then fetched, then deleted', function (t) {
	t.plan(3);

	pin.createView({name: 'qux'}, function (newEntityErr, newEntity) {
		t.equal(newEntity.name, 'qux');

		pin.fetchView({id: newEntity.id}, function (fetchEntityErr, fetchedEntity) {
			t.equal(fetchedEntity.name, 'qux');

			pin.deleteView({id: fetchedEntity.id}, function (deleteEntityErr) {
				t.equal(deleteEntityErr, null);
				t.end(newEntityErr && fetchEntityErr && deleteEntityErr);
			});
		});
	});
});
