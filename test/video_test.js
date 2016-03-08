'use strict';

// Nuke any existing log files
var test	 = require('tape');
var seneca = require('./seneca_helper');
var pin		= seneca.pin({role: 'catalog', cmd: '*'});
var _			= require('lodash');
var async	= require('async');
var schemaMap = require('@oddnetworks/odd-schemas').loadSchemas();
var dg = require('@oddnetworks/odd-schemas').newDataGenerator(schemaMap);
var before = test;
var factory = require('./factory');

before('before all tests', function (t) {
	async.series([
		seneca.next_act('role:catalog,cmd:seed')
	], t.end);
});

test('A video that has references are also deleted', function (t) {
	t.plan(9);

	pin.fetchView({id: '2a181af0-eea5-4a11-8c5a-3c2d146657d7'}, function (errView, view) {
		t.equal(view.relationships.featuredVideos.data.length, 3, 'view initially has 3');
		t.equal(view.relationships.featuredVideos.data[0].id, 'a-video-with-feature-keys', 'first video is set');

		pin.fetchCollection({id: '0aa512b2-f171-42ed-99e0-32cbd35d36b7'}, function (errVideoCollection, videoCollection) {
			t.equal(videoCollection.relationships.entities.data.length, 2, 'collection initially has 5');
			t.equal(videoCollection.relationships.entities.data[0].id, 'a-video-with-feature-keys', 'first video is set');

			pin.deleteVideo({id: 'a-video-with-feature-keys'}, function (errDeleteVideo) {
				t.equal(errDeleteVideo, null, 'no error on video delete');

				pin.fetchView({id: '2a181af0-eea5-4a11-8c5a-3c2d146657d7'}, function (errNewView, newView) {
					t.equal(newView.relationships.featuredVideos.data.length, 2, 'view now has 4');
					t.equal(newView.relationships.featuredVideos.data[0].id, 'a-video-without-feature-keys', 'first video is another video');

					pin.fetchCollection({id: '0aa512b2-f171-42ed-99e0-32cbd35d36b7'}, function (errNewVideoCollection, newVideoCollection) {
						t.equal(newVideoCollection.relationships.entities.data.length, 1, 'collection now has 4');
						t.equal(newVideoCollection.relationships.entities.data[0].id, 'ooyala-ARandomOddNetworksVideo', 'first video is another video');

						t.end(errView && errVideoCollection && errDeleteVideo && errNewView && errNewVideoCollection);
					});
				});
			});
		});
	});
});

test('A video that does not have features can be deleted', function (t) {
	t.plan(3);

	factory.upsertVideo()
		.then(function testVideo(res) {
			t.notOk(res.features, 'Video must not have features');

			return seneca.actAsync({role: 'catalog', cmd: 'fetchVideo', id: res.id});
		})
		.then(function deleteVideo(res) {
			t.ok(res.id, 'could not load video');

			return seneca.actAsync({role: 'catalog', cmd: 'deleteVideo', id: res.id});
		})
		.then(function verifyDelete() {
			t.ok(true, 'did not delete video');
		})
		.finally(function callEnd() {
			t.end();
		})
	;
});

before('re-seed', function (t) {
	async.series([
		seneca.next_act('role:catalog,cmd:seed')
	], t.end);
});

test('A video can be fetched', function (t) {
	t.plan(2);

	pin.fetchVideo({id: 'a-video-with-feature-keys'}, function (err, out) {
		t.equal(out.id, 'a-video-with-feature-keys');
		t.equal(out.title, 'A Random Odd Networks Video');
		t.end(err);
	});
});

test('A video can be listed', function (t) {
	t.plan(1);

	pin.fetchVideos({}, function (err, out) {
		t.ok(Array.isArray(out));
		t.end(err);
	});
});

test('A video can be listed by org', function (t) {
	t.plan(2);

	pin.fetchVideos({organization: {id: 'odd-networks'}}, function (err, out) {
		t.ok(Array.isArray(out));
		t.equal(out.length, 8);
		t.end(err);
	});
});

test('A video cannot be listed by a bad org', function (t) {
	t.plan(2);

	pin.fetchVideos({organization: {id: 'fake-org'}}, function (err, out) {
		t.ok(Array.isArray(out));
		t.equal(out.length, 0);
		t.end(err);
	});
});

test('A video can be created, then fetched, then deleted', function (t) {
	t.plan(3);
	var vid = dg.generateVideo();
	vid.name = 'test';
	pin.createVideo(vid, function (newEntityErr, newEntity) {
		t.equal(newEntity.name, 'test');

		pin.fetchVideo({id: newEntity.id}, function (fetchEntityErr, fetchedEntity) {
			t.equal(fetchedEntity.name, 'test');

			pin.deleteVideo({id: fetchedEntity.id}, function (deleteEntityErr) {
				t.equal(deleteEntityErr, null);
				t.end(newEntityErr && fetchEntityErr && deleteEntityErr);
			});
		});
	});
});

test('A video can be created then updated via upsert', function (t) {
	t.plan(4);
	var vid = dg.generateVideo();
	vid.name = 'create-test';
	pin.upsertVideo(vid, function (newEntityErr, newEntity) {
		t.equal(newEntity.name, 'create-test');

		vid.name = 'update-test';
		pin.upsertVideo(vid, function (updatedEntityErr, updatedEntity) {
			t.equal(newEntity.id, updatedEntity.id);
			t.equal(updatedEntity.name, 'update-test');

			pin.deleteVideo({id: updatedEntity.id}, function (deleteEntityErr) {
				t.equal(deleteEntityErr, null);
				t.end(newEntityErr && updatedEntityErr && updatedEntityErr);
			});
		});
	});
});

test('Upsert creates a new object when an object is provided without an id', function (t) {
	t.plan(2);
	var vid = dg.generateVideo();
	delete vid.id;
	vid.name = 'create-test';
	pin.upsertVideo(vid, function (newEntityErr, newEntity) {
		t.equal(newEntity.name, 'create-test');
		t.ok(_.isString(newEntity.id));

		pin.deleteVideo({id: newEntity.id}, function (deleteEntityErr) {
			t.end(newEntityErr && deleteEntityErr);
		});
	});
});

test('Organization -> Device -> Video features get applied', function (t) {
	t.plan(9);

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

	pin.fetchVideo({id: 'a-video-with-feature-keys', organization: organization, device: device}, function (err, result) {
		t.equal(result.ads.enabled, true);
		t.equal(result.ads.assetId, 'test');
		t.equal(result.ads.url, 'http://ads.com?assetId=test&missingVar={unknown.key}');
		t.equal(result.ads.format, 'vslap');
		t.equal(result.ads.provider, 'prisonsquare');
		t.equal(result.player.enabled, true);
		t.equal(result.player.type, 'external');
		t.equal(result.player.url, 'http://youtube.com/v/12345');
		t.equal(result.sharing.text, 'Check out this video: A Random Odd Networks Video');
		t.end(err);
	});
});

test('Fetching a video that does not exist returns null even when feature tags exist', function (t) {
	t.plan(1);

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
			}
		}
	};

	var device = {
		id: 'device-id',
		features: {
			ads: {
				enabled: true,
				format: 'vmap',
				url: 'http://prisonsquare.com/vmap.xml?mediaId=${ video.meta.sourceId }'
			}
		}
	};

	pin.fetchVideo({id: 'a-bad-id', organization: organization, device: device}, function (err, result) {
		t.equal(result, null);
		t.end(err);
	});
});

test('Fetching a video with a device without features', function (t) {
	t.plan(6);

	var organization = {
		id: 'odd-networks',
		features: {
			overlays: {
				enabled: true,
				url: 'http://example.com/image.png'
			},
			ads: {
				enabled: true,
				provider: 'prisonsquare',
				format: 'vast'
			},
			player: {
				enabled: true,
				type: 'ooyala',
				pCode: 'pee-code',
				domain: 'ooyala.com'
			}
		}
	};

	var device = {
		id: 'device-id'
	};

	pin.fetchVideo({id: 'a-video-without-feature-keys', organization: organization, device: device}, function (err, result) {
		t.equal(result.ads.enabled, true);
		t.equal(result.ads.assetId, 'a-video-without-feature-keys');
		t.equal(result.ads.format, 'vast');
		t.equal(result.ads.provider, 'prisonsquare');
		t.equal(result.player.enabled, true);
		t.equal(result.player.type, 'ooyala');
		t.end(err);
	});
});

test('User entitlements get computed', function (t) {
	t.plan(1);

	var user = {
		userEntitlements: ['bald', 'bearded']
	};

	pin.fetchVideo({id: 'a-video-with-feature-keys', user: user}, function (err, result) {
		t.equal(result.meta.entitled, true);
		t.end(err);
	});
});
