'use strict';

var _ = require('lodash');
var userEntitlements = require('../lib/user-entitlements');

var DataStore = function () {
	this.entity = null;
};

DataStore.prototype = {
	init: function (options) {
		this.entity = options.entity;

		_.bindAll(this, [
			'fetchEntity',
			'fetchEntities',
			'createEntity',
			'upsertEntity',
			'deleteEntity',
			'upsertEntityRelations'
		]);
		var fullname = options.entity.entity$;
		this._entityShortName = fullname.substr(fullname.lastIndexOf('/') + 1);
	},

	//  fetch entity
	//  catalog: catalog/entity
	//  provides: catalog/entity
	fetchEntity: function (args, done) {
		this.entity.load$(args.id, function (err, entity) {
			if (err) {
				return done(null);
			}

			entity = userEntitlements(entity, args.user);

			done(null, entity);
		});
	},

	//  list entity
	//  catalog: catalog/entity
	//  provides: catalog/entity
	fetchEntities: function (args, done) {
		this.entity.list$({}, function (err, result) {
			if (err) {
				return done(err);
			}

			var filter = {};

			if (_.has(args, 'organization.id')) {
				filter = _.assign({organization: args.organization.id}, filter);
			}

			if (_.has(args, 'filter')) {
				filter = _.assign(args.filter, filter);
			}

			if (!_.isEmpty(filter)) {
				// attributes do no exist in the JSON yet so remove them from the filter
				_.transform(filter, function (result, value, key) {
					var newKey = key.replace('attributes.', '');
					try {
						filter[newKey] = JSON.parse(value);
					} catch (err) {
						filter[newKey] = value;
					}

					if (key !== newKey) {
						delete filter[key];
					}
				});

				result = _.filter(result, filter);
			}

			result = _.map(result, function (entity) {
				return userEntitlements(entity, args.user);
			});

			done(null, result);
		});
	},

	//  create entity
	//  catalog: catalog/entity
	//  provides: catalog/entity
	createEntity: function (args, done) {
		var newEntity = this.entity.make$(_.omit(args, ['role', 'cmd']));
		newEntity.save$(done);
	},

	//  upsert entity
	//  catalog: catalog/entity
	//  provides: catalog/entity
	upsertEntity: function (args, done) {
		var that = this;
		// Create a new object if no id was provide
		if (args.id) {
			that.entity.load$(args.id, function (err, loadedEntity) {
				if (err) {
					return done(err);
				}

				// If no entity was found, it's not an error.  It means
				// that the args requested we use a specific id, and
				// an object doesn't exist in the store yet. Why does this happen? As an
				// example, in order for the sync service to know what record to upsert,
				// it composes ids to 'ooyala-{ooyalaId}', in this way it knows how to
				// upsert the same record each time.  This is a common use case for a
				// key/value store. @BJC
				if (loadedEntity) {
					loadedEntity = _.assign(loadedEntity, (_.omit(args, ['role', 'cmd'])));
					loadedEntity.save$(done);
				} else {
					that.createEntity(args, done);
				}
			});
		} else {
			this.createEntity(args, done);
		}
	},

	//  upsert entity relations
	//  catalog: catalog/entity
	//  provides: catalog/entity
	upsertEntityRelations: function (args, done) {
		var entityID = args.id;
		var relationKey = args.key;
		var updatedRelations = args.relations;

		var that = this;

		that.entity.load$(entityID, function (err, loadedEntity) {
			if (err) {
				return done(err);
			}

			if (!loadedEntity.relationships) {
				loadedEntity.relationships = {};
			}

			if (!loadedEntity.relationships[relationKey]) {
				loadedEntity.relationships[relationKey] = {data: []};
			}

			loadedEntity.relationships[relationKey].data = updatedRelations;

			loadedEntity.save$(done);
		});
	},

	//  delete entity
	//  catalog: catalog/entity
	//  provides: catalog/entity
	deleteEntity: function (args, done) {
		this.entity.delete$(args.id, done);
	}
};

module.exports = DataStore;
