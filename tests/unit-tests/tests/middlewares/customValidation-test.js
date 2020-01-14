'use strict';
const should = require('should'),
    sinon = require('sinon'),
    customValidation = require('../../../../src/tests/middlewares/customValidation');

const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];

describe('Testing customValidation', function () {
    let sandbox, reqStub, nextStub;
    before(() => {
        sandbox = sinon.sandbox.create();
        nextStub = sandbox.stub();
    });

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
                customValidation.createDslValidator(reqStub, undefined, nextStub);
                should(nextStub.args).eql([[]]);
            });
        });

    it('when request does not contain valid http method as a key - should call next with an error', function () {
        reqStub.body.request['zoozMethod'] = {};
        customValidation.createDslValidator(reqStub, undefined, nextStub);
        should(nextStub.args[0][0].message).eql('Input validation error');
        should(nextStub.args[0][0].errors).eql(['body request should have only one of properties: get,head,post,put,delete,connect,options,trace']);
    });
    it('when request has more then one key - should call next with an error', function () {
        reqStub.body.request['post'] = {};
        reqStub.body.request['get'] = {};
        customValidation.createDslValidator(reqStub, undefined, nextStub);
        should(nextStub.args[0][0].message).eql('Input validation error');
        should(nextStub.args[0][0].errors).eql(['body request should have only one of properties: get,head,post,put,delete,connect,options,trace']);
    });
});
