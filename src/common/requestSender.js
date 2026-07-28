const http = require('http');
const https = require('https');

const logger = require('./logger');

const TIMEOUT_MS = 15 * 1000;

// ponytail: node:http(s) instead of fetch because every caller talks to a cluster API over a
// self-signed cert and needs per-request `rejectUnauthorized: false` — fetch has no way to set
// that without the (non-requireable) undici Agent or a global NODE_TLS_REJECT_UNAUTHORIZED.
module.exports.send = async (options) => {
    try {
        const response = await request(options);
        const result = options.resolveWithFullResponse ? response : response.body;
        logger.info({ method: options.method, url: options.url, response: result }, 'Successful request');
        return result;
    } catch (error) {
        logger.error({ method: options.method, url: options.url, error }, 'Error occurred sending request');
        throw error;
    }
};

function request({ url, method = 'GET', headers = {}, body }) {
    const target = new URL(url);
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const transport = target.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
        const req = transport.request(target, {
            method,
            headers: {
                accept: 'application/json',
                ...(payload ? { 'content-type': 'application/json' } : {}),
                ...headers
            },
            timeout: TIMEOUT_MS,
            rejectUnauthorized: false
        }, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const raw = Buffer.concat(chunks).toString('utf8');
                const response = {
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: parseBody(raw)
                };
                if (res.statusCode >= 400) {
                    const error = new Error(`${res.statusCode} - ${raw}`);
                    error.statusCode = res.statusCode;
                    error.response = response;
                    return reject(error);
                }
                resolve(response);
            });
        });

        req.on('timeout', () => req.destroy(new Error(`Request to ${url} timed out after ${TIMEOUT_MS}ms`)));
        req.on('error', reject);
        req.end(payload);
    });
}

function parseBody(raw) {
    if (raw === '') {
        return undefined;
    }
    try {
        return JSON.parse(raw);
    } catch {
        return raw;
    }
}
