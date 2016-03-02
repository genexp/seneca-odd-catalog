'use strict';

// Nuke any existing log files
var test	 = require('tape');
var seneca = require('./seneca_helper');
var pin		= seneca.pin({role: 'catalog', cmd: '*'});
var schemaMap = require('@oddnetworks/odd-schemas').loadSchemas();
var dg = require('@oddnetworks/odd-schemas').newDataGenerator(schemaMap);
var async	= require('async');

var before = test;

before('before all tests', function (t) {
	async.series([
		seneca.next_act('role:catalog,cmd:seed')
	], t.end);
});

test('A promotion can be listed', function (t) {
	t.plan(1);

	pin.fetchPromotions({}, function (err, out) {
		t.ok(Array.isArray(out));
		t.end(err);
	});
});

test('A promotion can be created, then fetched, then deleted', function (t) {
	t.plan(3);
	var prom = dg.generatePromotion();
	prom.name = 'test';
	pin.createPromotion(prom, function (newEntityErr, newEntity) {
		t.equal(newEntity.name, 'test');

		pin.fetchPromotion({id: newEntity.id}, function (fetchEntityErr, fetchedEntity) {
			t.equal(fetchedEntity.name, 'test');

			pin.deletePromotion({id: fetchedEntity.id}, function (deleteEntityErr) {
				t.equal(deleteEntityErr, null);
				t.end(newEntityErr && fetchEntityErr && deleteEntityErr);
			});
		});
	});
});
