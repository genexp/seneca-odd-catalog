var test = require('tape');
var userEntitlements = require('../../lib/user-entitlements');

test('Entitled entity with proper entitlements', function (t) {
	t.plan(1);

	var user = {
		userEntitlements: ['bald', 'bearded', 'beautiful']
	};

	var entity = {
		meta: {
			entitlements: ['bald', 'beautiful']
		}
	};

	entity = userEntitlements(entity, user);

	t.equal(entity.meta.entitled, true);
	t.end();
});

test('Not entitled with missing user', function (t) {
	t.plan(1);

	var user = null;

	var entity = {
		meta: {
			entitlements: ['bald', 'beautiful']
		}
	};

	entity = userEntitlements(entity, user);

	t.equal(entity.meta.entitled, false);
	t.end();
});

test('Entitled with missing user and entity entitlements', function (t) {
	t.plan(1);

	var user = null;

	var entity = {
		meta: null
	};

	entity = userEntitlements(entity, user);

	t.equal(entity.meta.entitled, true);
	t.end();
});

test('Not entitled with missing entitlments', function (t) {
	t.plan(1);

	var user = {
		userEntitlements: []
	};

	var entity = {
		meta: {
			entitlements: ['bald', 'beautiful']
		}
	};

	entity = userEntitlements(entity, user);

	t.equal(entity.meta.entitled, false);
	t.end();
});

test('Entitled with entity not having any entitlements set', function (t) {
	t.plan(1);

	var user = {
		userEntitlements: ['bald', 'bearded', 'beautiful']
	};

	var entity = {
		meta: {
			entitlements: []
		}
	};

	entity = userEntitlements(entity, user);

	t.equal(entity.meta.entitled, true);
	t.end();
});
