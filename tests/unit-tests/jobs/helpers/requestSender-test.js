'use-strict';
const logger = require('../../../../src/common/logger');
const sinon = require('sinon');
// eslint-disable-next-line no-unused-vars
const should = require('should');
const rewire = require('rewire');
const requestSender = rewire('../../../../src/common/requestSender');

describe('Request sender tests', () => {
    let sandbox, infoStub, errorStub, requestStub;
    before(() => {
        sandbox = sinon.sandbox.create();
        infoStub = sandbox.stub(logger, 'info');
        errorStub = sandbox.stub(logger, 'error');
        requestStub = sandbox.stub();
        requestSender.__set__('got', requestStub);
    });

    afterEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    it('Successful request ', async () => {
        requestStub.resolves(({ response: {} }));

        await requestSender.send({ method: 'post', json: { pets: [] }, headers: {}, url: 'https://httpbin.org/anything' });

        requestStub.args[0][0].should.eql({
            json: {
                pets: []
            },
            headers: {},
            method: 'post',
            rejectUnauthorized: false,
            resolveBodyOnly: true,
            responseType: "json",
            timeout: 15000,
            url: 'https://httpbin.org/anything'
        });
        errorStub.callCount.should.eql(0);
        infoStub.args[0][0].should.eql({ method: 'post', url: 'https://httpbin.org/anything', response: { response: {} } });
    });

    it('Failure request ', async () => {
        requestStub.rejects({ statusCode: 500 });

        try {
            await requestSender.send({ method: 'post', json: { pets: [] }, headers: {}, url: 'http://www.zooz.com' });
            throw new Error('Should not get here');
        } catch (error) {
            infoStub.callCount.should.eql(0);
            errorStub.callCount.should.eql(1);
            errorStub.args[0][0].should.eql({
                error: {
                    statusCode: 500
                },
                method: 'post',
                url: 'http://www.zooz.com'
            });
        }
    });
});
