'use strict';

const pino = require('pino');

const logger = pino({
    name: 'predator',
    level: process.env.LOG_LEVEL || 'info'
});

module.exports = logger;
