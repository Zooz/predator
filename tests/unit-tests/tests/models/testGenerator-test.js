'use strict';
const should = require('should'),
    sinon = require('sinon'),
    testGenerator = require('../../../../src/tests/models/testGenerator'),
    database = require('../../../../src/tests/models/database');

describe('Scenario generator tests', function(){
    let sandbox, getDslDefinitionsStub;
    before(function () {
        sandbox = sinon.sandbox.create();
        getDslDefinitionsStub = sandbox.stub(database, 'getDslDefinitions');
    });
    beforeEach(function () {
        getDslDefinitionsStub.returns(Promise.resolve(definitions));
    });
    after(function () {
        sandbox.restore();
    });
    [
        'Test_with_before',
        'Test_with_successful_validation',
        'Test_with_several_scenarios_and_weights',
        'Test_with_wait_in_step',
        'Test_with_vars_multiple_scenarios',
        'Custom_test'

    ].forEach(function(scenario) {
        it(scenario, function(){
            let testResult = require('../../../testResults/' + scenario + '.json');
            let testDetails = require('../../../testExamples/' + scenario + '.json');
            return testGenerator.createTest(testDetails)
                .then(function(testGenerated) {
                    should(JSON.parse(JSON.stringify(testGenerated))).eql(testResult);
                });
        });
    });
});

const definitions = [
    {
        definition_name: 'createPayment',
        artillery_json: {
            'post': {
                'capture': [{
                    'as': 'paymentId',
                    'json': '$.id'
                }],
                'forever': true,
                'gzip': true,
                'headers': {
                    'Content-Type': 'application/json',
                    'x-payments-os-env': 'test'
                },
                'json': {
                    'amount': 5,
                    'billing_address': {
                        'city': 'Greenville',
                        'country': 'USA',
                        'email': 'pm_billing@a.com',
                        'first_name': 'John',
                        'gender': 'Male',
                        'last_name': 'Adams',
                        'line1': '10705 Old Mill Rd',
                        'state': 'TX',
                        'title': 'Mr',
                        'zip_code': '75402-3435'
                    },
                    'currency': 'USD',
                    'shipping_address': {
                        'city': 'Greenville',
                        'country': 'USA',
                        'line1': '10705 Old Mill Rd',
                        'phone': '095090941',
                        'salutation': 'Dr',
                        'state': 'TX',
                        'zip_code': '75402-3435'
                    }
                },
                'url': '/payments'
            }
        }
    },
    {
        definition_name: 'createAuthorize',
        artillery_json: {
            'post': {
                'capture': [{
                    'as': 'authorizeId',
                    'json': '$.id'
                }],
                'forever': true,
                'gzip': true,
                'headers': {
                    'Content-Type': 'application/json',
                    'x-payments-os-env': 'test'
                },
                'json': {
                    'payment_method': {
                        'credit_card_cvv': '123',
                        'token': '{{ tokenId }}',
                        'type': 'tokenized'
                    }
                },
                'url': '/payments/{{ paymentId }}/authorizations'
            }
        }
    },
    {
        definition_name: 'createVoid',
        artillery_json: {
            'post': {
                'forever': true,
                'gzip': true,
                'headers': {
                    'Content-Type': 'application/json',
                    'x-payments-os-env': 'test'
                },
                'json': {},
                'url': '/payments/{{ paymentId }}/voids'
            }
        }
    },
    {
        definition_name: 'createToken',
        artillery_json: {
            'post': {
                'capture': [{
                    'as': 'tokenId',
                    'json': '$.token'
                }],
                'forever': true,
                'gzip': true,
                'headers': {
                    'Content-Type': 'application/json',
                    'x-payments-os-env': 'test'
                },
                'json': {
                    'billing_address': {
                        'city': 'Plata',
                        'country': 'ARG',
                        'first_name': 'FN',
                        'last_name': 'LN',
                        'line1': 'Viamonte',
                        'line2': '1366',
                        'phone': '7563126',
                        'state': 'Buenos Aires',
                        'zip_code': '64000'
                    },
                    'card_number': '4580458045804580',
                    'expiration_date': '11/2020',
                    'holder_name': 'MY NAME',
                    'identity_document': {
                        'number': '5415668464654',
                        'type': 'ID'
                    },
                    'token_type': 'credit_card'
                },
                'url': '/tokens'
            }
        }
    },
    {
        definition_name: 'createCustomer',
        artillery_json: {
            'post': {
                'capture': [{
                    'as': 'customerId',
                    'json': '$.id'
                }],
                'forever': true,
                'gzip': true,
                'headers': {
                    'Content-Type': 'application/json',
                    'x-payments-os-env': 'test'
                },
                'json': {
                    'customer_reference': '{{ $randomString() }}',
                    'email': 'test@gmail.com'
                },
                'url': '/customers'
            }
        }
    },
    {
        definition_name: 'getToken',
        artillery_json: {
            'get': {
                'forever': true,
                'headers': {
                    'Content-Type': 'application/json',
                    'x-payments-os-env': 'test'
                },
                'url': '/tokens/{{ tokenId }}'
            }
        }
    },
    {
        definition_name: 'assignTokenToCustomer',
        artillery_json: {
            'post': {
                'url': '/customers/{{ customerId }}/payment-methods/{{ tokenId }}',
                'gzip': true,
                'forever': true,
                'headers': {
                    'x-payments-os-env': 'test',
                    'Content-Type': 'application/json'
                }
            }
        }
    }
];