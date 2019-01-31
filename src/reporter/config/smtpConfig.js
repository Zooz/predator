'use strict';

let config = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    timeout: process.env.SMTP_TIMEOUT || 2000
};

module.exports = config;