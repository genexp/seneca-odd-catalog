# seneca-odd-catalog

[![Build Status](https://travis-ci.org/oddnetworks/seneca-odd-catalog.svg?branch=master)](https://travis-ci.org/oddnetworks/seneca-odd-catalog)

This module is a plugin for the Seneca framework for organizations and devices.

## Install

seneca-odd-catalog is a [Seneca](http://senecajs.org/) plugin.  In order to use seneca-odd-catalog, you must have Seneca installed in your project.  To install it:

```
npm install --save seneca
npm install --save git@github.com:oddnetworks/seneca-odd-catalog.git
```

## Usage

Since seneca-odd-catalog is a seneca plugin, it can be registered to the seneca instance simply by adding the line

```js
var catalog = require('catalog');
seneca.use({init: catalog, name: 'catalog'});
```

## License

Apache 2.0 © [Odd Networks](http://oddnetworks.com)
