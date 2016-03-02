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

test('Fetching lists can be filtered', function (t) {
	t.plan(2);

	pin.fetchPromotions({filter: {images: {aspect16x9: 'http://image.oddworks.io/eooyala/94MmYydjpIN78xubYk0YtNLG8yJ7sXhn/promo260476980.jpg'}}}, function (err, result) {
		t.ok(Array.isArray(result));
		t.equal(result[0].id, 'fbec8574-6eb0-4339-91db-7833d96ed8c8');
		t.end(err);
	});
});
