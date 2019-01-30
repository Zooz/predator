'use strict';

let bunyan = require('bunyan');

let logger = bunyan.createLogger({
    name: 'predator',
    level: process.env.LOG_LEVEL || 'info'
});

module.exports = logger;