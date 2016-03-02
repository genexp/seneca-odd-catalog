'use strict';

// Nuke any existing log files
var seneca = require('./seneca_helper');
var test	 = require('tape');

test('The plugin should correctly require seneca', function (t) {
	t.ok(seneca.version);
	t.end();
});
