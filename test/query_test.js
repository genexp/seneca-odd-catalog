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

test('A query can be fetched', function (t) {
	t.plan(2);

	pin.fetchQuery({id: '23269662-dd21-4dc0-b484-6a29769ae0af'}, function (err, out) {
		t.equal(out.id, '23269662-dd21-4dc0-b484-6a29769ae0af', 'IDs are equal');
		t.equal(out.included, undefined);
		t.end(err);
	});
});

test('A query can be fetched using utter garbage as an id', function (t) {
	t.plan(1);

	pin.fetchQuery({id: '#$%^&*()'}, function (err, data) {
		t.equal(data, null);
		t.end(err);
	});
});

test('A query can be listed', function (t) {
	t.plan(1);

	pin.fetchQueries({}, function (err, out) {
		t.ok(Array.isArray(out));
		t.end(err);
	});
});

test('A query can be created, then fetched, then deleted', function (t) {
	t.plan(3);

	pin.createQuery({name: 'qux'}, function (newEntityErr, newEntity) {
		t.equal(newEntity.name, 'qux');

		pin.fetchQuery({id: newEntity.id}, function (fetchEntityErr, fetchedEntity) {
			t.equal(fetchedEntity.name, 'qux');

			pin.deleteQuery({id: fetchedEntity.id}, function (deleteEntityErr) {
				t.equal(deleteEntityErr, null);
				t.end(newEntityErr && fetchEntityErr && deleteEntityErr);
			});
		});
	});
});
