'use strict';

let pino = require('pino');

let logger = pino({
    name: 'predator',
    level: process.env.LOG_LEVEL || 'info'
});

module.exports = logger;