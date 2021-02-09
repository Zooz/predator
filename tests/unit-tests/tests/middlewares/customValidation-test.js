'use strict';
const should = require('should'),
    sandbox = require('sinon').createSandbox(),
    customValidation = require('../../../../src/tests/middlewares/customValidation');

const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];

describe('Testing customValidation', function () {
    let reqStub;

    beforeEach(() => {
        reqStub = {
            body: {
                request: {}
            }
        };
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    httpMethods
        .forEach(function (method) {
            it(`when request is valid ${method} - should call next`, function () {
                reqStub.body.request[method] = {};
                should.doesNotThrow(() => customValidation.createDslValidator(reqStub, undefined));
            });
        });

    it('when request does not contain valid http method as a key - should call next with an error', function () {
        reqStub.body.request.zoozMethod = {};
        (() => customValidation.createDslValidator(reqStub, undefined)).should.throw({
            message: 'Input validation error',
            errors: ['body request should have only one of properties: get,head,post,put,delete,connect,options,trace']
        });
    });
    it('when request has more then one key - should call next with an error', function () {
        reqStub.body.request.post = {};
        reqStub.body.request.get = {};
        (() => customValidation.createDslValidator(reqStub, undefined)).should.throw({
            message: 'Input validation error',
            errors: ['body request should have only one of properties: get,head,post,put,delete,connect,options,trace']
        });
    });
});
