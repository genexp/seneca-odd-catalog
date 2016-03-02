var UTIL = require('util');

module.exports = function OddCatalogError(message) {
	Error.call(this);
	Error.captureStackTrace(this, this.constructor);
	this.name = this.constructor.name;
	this.message = message;
};

UTIL.inherits(module.exports, Error);
