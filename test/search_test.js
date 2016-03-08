'use strict';

// Nuke any existing log files
var seneca = require('./seneca_helper');
var pin		= seneca.pin({role: 'catalog', cmd: '*'});
var test	 = require('tape');
var async	= require('async');
var before = test;
var after = test;

before('before all tests', function (t) {
	async.series([
		seneca.next_act('role:catalog,cmd:flush_es'),
		seneca.next_act('role:catalog,cmd:index_es'),
		seneca.next_act('role:catalog,cmd:seed')
	], t.end);
});

test('A search can search without decorating entities', function (t) {
	t.plan(9);

	pin.search({term: 'Odd'}, function (err, out) {
		t.ok(Array.isArray(out.data), 'results are an array');
		t.equal(out.meta.total, 3, 'matches 1 result');
		t.equal(out.data.length, 3, 'returns 1 result');
		t.equal(out.meta.term, 'Odd', 'shows the term');
		t.equal(out.meta.limit, 10, 'shows the limit');
		t.equal(out.meta.offset, 0, 'shows the offset');
		t.equal(out.meta.entityTypes.join(','), 'video,collection', 'shows the entity types');
		t.notOk(out.data[0].ads);
		t.notOk(out.data[0].player);
		t.end(err);
	});
});

test('A search can filter by orgnization and device', function (t) {
	t.plan(10);

	var organization = {
		id: 'odd-networks',
		title: 'Odd Networks',
		features: {
			ads: {
				format: 'vast'
			}
		}
	};

	var device = {
		id: 'ios',
		features: {
			player: {
				type: 'external'
			}
		}
	};

	pin.search({term: 'odd', organization: organization, device: device}, function (err, out) {
		t.ok(Array.isArray(out.data), 'results are an array');
		t.equal(out.meta.total, 3, 'matches 3 result');
		t.equal(out.data.length, 3, 'returns 1 result');
		t.equal(out.meta.term, 'odd', 'shows the term');
		t.equal(out.meta.limit, 10, 'shows the limit');
		t.equal(out.meta.offset, 0, 'shows the offset');
		t.equal(out.meta.entityTypes.join(','), 'video,collection', 'shows the entity types');
		t.equal(out.data[0].ads.format, 'vast');
		t.equal(out.data[0].ads.assetId, 'a-video-without-feature-keys');
		t.equal(out.data[0].player.type, 'external');
		t.end(err);
	});
});

test('A search can be executed with only only specifying a term of garbage', function (t) {
	t.plan(7);

	// Returns no results for total garbage with correct meta
	pin.search({term: '"TOTALGARBAGEKJSDFKJH"'}, function (err, out) {
		t.ok(Array.isArray(out.data), 'results are an array');
		t.equal(out.meta.total, 0, 'matches 0 result');
		t.equal(out.data.length, 0, 'returns 0 result');
		t.equal(out.meta.term, '"TOTALGARBAGEKJSDFKJH"', 'shows the term');
		t.equal(out.meta.limit, 10, 'shows the limit');
		t.equal(out.meta.offset, 0, 'shows the offset');
		t.equal(out.meta.entityTypes.join(','), 'video,collection', 'shows the entity types');
		t.end(err);
	});
});

test('A search can be executed with all the options set', function (t) {
	t.plan(7);

	pin.search({term: 'odd', limit: 1, offset: 2, entityTypes: ['video']}, function (err, out) {
		t.ok(Array.isArray(out.data), 'results are an array');
		t.equal(out.meta.total, 3, 'matches 3 results');
		t.equal(out.data.length, 1, 'returns 1 results');
		t.equal(out.meta.term, 'odd', 'shows the term');
		t.equal(out.meta.limit, 1, 'shows the limit');
		t.equal(out.meta.offset, 2, 'shows the offset');
		t.equal(out.meta.entityTypes.join(','), 'video', 'shows the entity types');
		t.end(err);
	});
});

test('Does a partial match search', function (t) {
	t.plan(7);

	pin.search({term: 'Netwo', limit: 3, offset: 2, entityTypes: ['video']}, function (err, out) {
		t.ok(Array.isArray(out.data), 'results are an array');
		t.equal(out.meta.total, 3, 'matches 3 results');
		t.equal(out.data.length, 1, 'returns 1 results');
		t.equal(out.meta.term, 'Netwo', 'shows the term');
		t.equal(out.meta.limit, 3, 'shows the limit');
		t.equal(out.meta.offset, 2, 'shows the offset');
		t.equal(out.meta.entityTypes.join(','), 'video', 'shows the entity types');
		t.end(err);
	});
});

test('Without quotes does an and query', function (t) {
	t.plan(7);

	pin.search({term: 'Odd Networks'}, function (err, out) {
		t.ok(Array.isArray(out.data), 'results are an array');
		t.equal(out.meta.total, 3, 'matches 2 results');
		t.equal(out.data.length, 3, 'returns 2 results');
		t.equal(out.meta.term, 'Odd Networks', 'shows the term');
		t.equal(out.meta.limit, 10, 'shows the limit');
		t.equal(out.meta.offset, 0, 'shows the offset');
		t.equal(out.meta.entityTypes.join(','), 'video,collection', 'shows the entity types');
		t.end(err);
	});
});

test('Does the same search regardless of quotes', function (t) {
	t.plan(7);

	pin.search({term: '"Odd Networks"'}, function (err, out) {
		t.ok(Array.isArray(out.data), 'results are an array');
		t.equal(out.meta.total, 3, 'matches 2 results');
		t.equal(out.data.length, 3, 'returns 2 results');
		t.equal(out.meta.term, '"Odd Networks"', 'shows the term');
		t.equal(out.meta.limit, 10, 'shows the limit');
		t.equal(out.meta.offset, 0, 'shows the offset');
		t.equal(out.meta.entityTypes.join(','), 'video,collection', 'shows the entity types');
		t.end(err);
	});
});

test('A search can be executed with weird characters', function (t) {
	t.plan(7);

	pin.search({term: ':::'}, function (err, out) {
		t.ok(Array.isArray(out.data), 'results are an array');
		t.equal(out.meta.total, 0, 'matches 0 results');
		t.equal(out.data.length, 0, 'returns 0 results');
		t.equal(out.meta.term, '\:\:\:', 'shows the term');
		t.equal(out.meta.limit, 10, 'shows the limit');
		t.equal(out.meta.offset, 0, 'shows the offset');
		t.equal(out.meta.entityTypes.join(','), 'video,collection', 'shows the entity types');
		t.end(err);
	});
});

after('after all tests', function (t) {
	async.series([
		seneca.next_act('role:catalog,cmd:flush_es')
	], t.end);
});
