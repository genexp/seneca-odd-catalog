'use strict';

module.exports = {
	strict: {
		add: false
	},
	catalog: {
		enableFlush: true
	},
	elasticsearch: {
		host: '127.0.0.1:9200',
		keepAlive: false,
		sniffInterval: 0,
		index: 'catalog_test'
	}
};
