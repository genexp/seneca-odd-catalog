var _ = require('lodash');

module.exports = function userEntitlements(entity, user) {
	_.set(entity, 'meta.entitled', true);

	var entityEntitlements = _.get(entity, 'meta.entitlements', []);
	if (entityEntitlements.length > 0) {
		if (user) {
			var userEntitlements = _.get(user, 'userEntitlements', []);
			var entitlements = _.intersection(entityEntitlements, userEntitlements);
			_.set(entity, 'meta.entitled', Boolean(entitlements.length));
		} else {
			_.set(entity, 'meta.entitled', false);
		}
	}

	return entity;
};
