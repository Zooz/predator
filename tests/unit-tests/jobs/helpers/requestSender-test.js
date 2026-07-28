'use-strict';
const http = require('http');
const logger = require('../../../../src/common/logger');
const sinon = require('sinon');
// eslint-disable-next-line no-unused-vars
const should = require('should');
const requestSender = require('../../../../src/common/requestSender');

describe('Request sender tests', () => {
    let sandbox, infoStub, errorStub, server, baseUrl, lastRequest;

    before((done) => {
        sandbox = sinon.createSandbox();
        infoStub = sandbox.stub(logger, 'info');
        errorStub = sandbox.stub(logger, 'error');

        server = http.createServer((req, res) => {
            const chunks = [];
            req.on('data', chunk => chunks.push(chunk));
            req.on('end', () => {
                lastRequest = { method: req.method, url: req.url, headers: req.headers, body: Buffer.concat(chunks).toString('utf8') };
                if (req.url === '/boom') {
                    res.writeHead(500, { 'content-type': 'application/json' });
                    return res.end(JSON.stringify({ message: 'kaboom' }));
                }
                if (req.url === '/text') {
                    res.writeHead(200, { 'content-type': 'text/plain' });
                    return res.end('some logs');
                }
                res.writeHead(200, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ response: {} }));
            });
        }).listen(0, '127.0.0.1', () => {
            baseUrl = `http://127.0.0.1:${server.address().port}`;
            done();
        });
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
        server.close();
    });

    it('Successful request', async () => {
        const response = await requestSender.send({ method: 'POST', body: { pets: [] }, headers: { 'x-custom': 'yes' }, url: `${baseUrl}/pets` });

        response.should.eql({ response: {} });
        lastRequest.method.should.eql('POST');
        lastRequest.url.should.eql('/pets');
        lastRequest.body.should.eql('{"pets":[]}');
        lastRequest.headers['content-type'].should.eql('application/json');
        lastRequest.headers['x-custom'].should.eql('yes');
        errorStub.callCount.should.eql(0);
        infoStub.args[0][0].should.eql({ method: 'POST', url: `${baseUrl}/pets`, response: { response: {} } });
    });

    it('Non-JSON response body is returned as-is', async () => {
        const response = await requestSender.send({ method: 'GET', url: `${baseUrl}/text` });
        response.should.eql('some logs');
    });

    it('resolveWithFullResponse returns the status code alongside the body', async () => {
        const response = await requestSender.send({ method: 'GET', url: `${baseUrl}/pets`, resolveWithFullResponse: true });
        response.statusCode.should.eql(200);
        response.body.should.eql({ response: {} });
    });

    it('Failure request rejects with statusCode', async () => {
        try {
            await requestSender.send({ method: 'POST', body: { pets: [] }, headers: {}, url: `${baseUrl}/boom` });
            throw new Error('Should not get here');
        } catch (error) {
            error.statusCode.should.eql(500);
            infoStub.callCount.should.eql(0);
            errorStub.callCount.should.eql(1);
            errorStub.args[0][0].method.should.eql('POST');
            errorStub.args[0][0].url.should.eql(`${baseUrl}/boom`);
        }
    });
});
