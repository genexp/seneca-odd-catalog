'use strict';

// Nuke any existing log files
var test = require('tape');
var seneca = require('./seneca_helper');
var schemaMap = require('@oddnetworks/odd-schemas').loadSchemas();
var dg = require('@oddnetworks/odd-schemas').newDataGenerator(schemaMap);
var pin = seneca.pin({role: 'catalog', cmd: '*'});
var async = require('async');

var before = test;

before('before all tests', function (t) {
	async.series([
		seneca.next_act('role:catalog,cmd:seed')
	], t.end);
});

test('A live stream can be listed', function (t) {
	t.plan(1);

	pin.fetchLiveStreams({}, function (err, out) {
		t.ok(Array.isArray(out));
		t.end(err);
	});
});

test('A live stream can be created, then fetched, then deleted', function (t) {
	t.plan(3);
	var lStream = dg.generateLiveStream();
	lStream.name = 'test';
	pin.createLiveStream(lStream, function (newEntityErr, newEntity) {
		t.equal(newEntity.name, 'test');

		pin.fetchLiveStream({id: newEntity.id}, function (fetchEntityErr, fetchedEntity) {
			t.equal(fetchedEntity.name, 'test');

			pin.deleteLiveStream({id: fetchedEntity.id}, function (deleteEntityErr) {
				t.equal(deleteEntityErr, null);
				t.end(newEntityErr && fetchEntityErr && deleteEntityErr);
			});
		});
	});
});

test('Organization -> Device -> liveStream features get applied', function (t) {
	t.plan(8);

	var organization = {
		id: 'odd-networks',
		features: {
			overlays: {
				enabled: true,
				url: 'http://example.com/image.png'
			},
			ads: {
				provider: 'prisonsquare',
				format: 'vast'
			},
			player: {
				enabled: true,
				type: 'ooyala',
				pCode: 'pee-code',
				domain: 'ooyala.com'
			},
			sharing: {
				text: 'Check out this video: {title}'
			}
		}
	};

	var device = {
		id: 'device-id',
		features: {
			ads: {
				enabled: true,
				format: 'vmap',
				url: 'http://prisonsquare.com/vmap.xml?mediaId={video.meta.sourceId}'
			}
		}
	};

	pin.fetchLiveStream({id: 'dd4280d7-b587-420c-8546-fd731d60a926', organization: organization, device: device}, function (err, result) {
		t.equal(result.ads.enabled, true);
		t.equal(result.ads.assetId, 'dd4280d7-b587-420c-8546-fd731d60a926');
		t.equal(result.ads.url, 'http://prisonsquare.com/vmap.xml?mediaId={video.meta.sourceId}');
		t.equal(result.ads.format, 'vmap');
		t.equal(result.ads.provider, 'prisonsquare');
		t.equal(result.player.enabled, true);
		t.equal(result.player.type, 'ooyala');
		t.equal(result.sharing.text, 'Check out this video: Odd Networks Live Stream');
		t.end(err);
	});
});
