'use-strict';
let logger = require('../../../../src/common/logger');
let sinon = require('sinon');
let should = require('should');
let rewire = require('rewire');
let requestSender = rewire('../../../../src/common/requestSender');

describe('Request sender tests', () => {
    let sandbox, infoStub, errorStub, requestStub;
    before(() => {
        sandbox = sinon.sandbox.create();
        infoStub = sandbox.stub(logger, 'info');
        errorStub = sandbox.stub(logger, 'error');
        requestStub = sandbox.stub();
        requestSender.__set__('request', requestStub);
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    it('Successful request ', async () => {
        requestStub.resolves(({ response: {} }));

        await requestSender.send({ method: 'post', body: { pets: [] }, headers: {}, url: 'http://www.walla.com' });

        requestStub.args[0][0].should.eql({
            'body': {
                'pets': []
            },
            'headers': {},
            'json': true,
            'method': 'post',
            'rejectUnauthorized': false,
            'timeout': 15000,
            'url': 'http://www.walla.com'
        });
        errorStub.callCount.should.eql(0);
        infoStub.args[0][0].should.eql({ method: 'post', url: 'http://www.walla.com', response: { response: {} } });
    });

    it('Failure request ', async () => {
        requestStub.rejects({ statusCode: 500 });

        try {
            await requestSender.send({ method: 'post', body: { pets: [] }, headers: {}, url: 'http://www.zooz.com' });
            throw new Error('Should not get here');
        } catch (error) {
            infoStub.callCount.should.eql(0);
            errorStub.callCount.should.eql(1);
            errorStub.args[0][0].should.eql({
                'error': {
                    'statusCode': 500
                },
                'method': 'post',
                'url': 'http://www.zooz.com'
            });
        }
    });
});