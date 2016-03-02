var _ = require('lodash');
var aws4 = require('aws4');
var util = require('util');
var url = require('url');
var HttpConnector = require('elasticsearch/src/lib/connectors/http');
var config = {};

module.exports = function factory(options) {
	options = options || {};
	config.creds = options.creds || {};
	config.region = options.region || 'us-west-2';
	config.host = url.parse(options.host).hostname || null;
	return AWSESConnector;
};

function AWSESConnector(host, config) {
	HttpConnector.call(this, host, config);
}

util.inherits(AWSESConnector, HttpConnector);

AWSESConnector.prototype.makeReqParams = function (params) {
	params = params || {};
	var awsOpts = {
		service: 'es',
		host: config.host,
		region: config.region
	};
	aws4.sign(_.extend(params, awsOpts), config.creds);
	return HttpConnector.prototype.makeReqParams.call(this, params);
};

