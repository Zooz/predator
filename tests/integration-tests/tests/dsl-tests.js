
const should = require('should'),
    requestSender = require('./helpers/requestCreator');

describe('Testing dsl tests api', function () {
    let dslName;
    before(async function f() {
        await requestSender.init();
    });
    beforeEach(function () {
        dslName = requestSender.generateUniqueDslName('paymentsOs');
    });
    describe('success scenarios', function () {
        it('succeed post dsl definition', async function () {
            const createDslResponse = await requestSender.createDsl(dslName, 'create_payment', createPaymentRequest);
            should(createDslResponse.statusCode).eql(201, JSON.stringify(createDslResponse.body));
            should(createDslResponse.body).eql(expectedCreatePaymentBody);

            const getResponse = await requestSender.getDsl(dslName, 'create_payment');
            should(getResponse.statusCode).eql(200, JSON.stringify(getResponse.body));
            should(getResponse.body).eql(expectedCreatePaymentBody);
        });

        it('create dsl which already exist - should return 400', async function () {
            let createDslResponse = await requestSender.createDsl(dslName, 'create_payment', createPaymentRequest);
            should(createDslResponse.statusCode).eql(201, JSON.stringify(createDslResponse.body));

            createDslResponse = await requestSender.createDsl(dslName, 'create_payment', createPaymentRequest);
            should(createDslResponse.statusCode).eql(400, JSON.stringify(createDslResponse.body));
            should(createDslResponse.body).eql({
                'message': 'Definition already exists'
            });
        });

        it('succeed post two dsl definition and get them by same dsl name', async function () {
            let createDslResponse = await requestSender.createDsl(dslName, 'create_payment', createPaymentRequest);
            should(createDslResponse.statusCode).eql(201, JSON.stringify(createDslResponse.body));
            createDslResponse = await requestSender.createDsl(dslName, 'register', registerRequest);
            should(createDslResponse.statusCode).eql(201, JSON.stringify(createDslResponse.body));

            const getDefinitions = await requestSender.getDslDefinitions(dslName);
            should(getDefinitions.statusCode).eql(200, JSON.stringify(getDefinitions.body));
            should(getDefinitions.body).eql(expectedGetDefinitionsResponse);
        });

        it('when get definitions of not exist dsl name - should return 200 with empty array', async function () {
            const getDefinitions = await requestSender.getDslDefinitions(dslName);
            should(getDefinitions.statusCode).eql(200, JSON.stringify(getDefinitions.body));
            should(getDefinitions.body).eql([]);
        });

        it('succeed update definition', async function () {
            const createDslResponse = await requestSender.createDsl(dslName, 'create_payment', createPaymentRequest);
            should(createDslResponse.statusCode).eql(201, JSON.stringify(createDslResponse.body));

            const updateResponse = await requestSender.updateDsl(dslName, 'create_payment', registerRequest);
            should(updateResponse.statusCode).eql(200, JSON.stringify(updateResponse.body));

            const getResponse = await requestSender.getDsl(dslName, 'create_payment');
            should(getResponse.statusCode).eql(200, JSON.stringify(getResponse.body));
            should(getResponse.body.request).eql(registerRequest);
        });

        it('succeed delete existing definition', async function () {
            const createDslResponse = await requestSender.createDsl(dslName, 'create_payment', createPaymentRequest);
            should(createDslResponse.statusCode).eql(201, JSON.stringify(createDslResponse.body));

            const deleteResponse = await requestSender.deleteDsl(dslName, 'create_payment');
            should(deleteResponse.statusCode).eql(204, JSON.stringify(deleteResponse.body));
            should(deleteResponse.body).eql({}, JSON.stringify(deleteResponse.body));

            const getResponse = await requestSender.getDsl(dslName, 'create_payment');
            should(getResponse.statusCode).eql(404, JSON.stringify(getResponse.body));
            should(getResponse.body).eql({ message: 'Not found' });
        });

        it('succeed post two dsl definition with same name under two different dsl name and get them', async function () {
            const otherDsl = dslName + '2';
            let createDslResponse = await requestSender.createDsl(dslName, 'create_payment', createPaymentRequest);
            should(createDslResponse.statusCode).eql(201, JSON.stringify(createDslResponse.body));
            createDslResponse = await requestSender.createDsl(otherDsl, 'create_payment', registerRequest);
            should(createDslResponse.statusCode).eql(201, JSON.stringify(createDslResponse.body));

            let getDefinition = await requestSender.getDsl(dslName, 'create_payment');
            should(getDefinition.statusCode).eql(200, JSON.stringify(getDefinition.body));
            should(getDefinition.body).eql(expectedCreatePaymentBody);

            getDefinition = await requestSender.getDsl(otherDsl, 'create_payment');
            should(getDefinition.statusCode).eql(200, JSON.stringify(getDefinition.body));
            should(getDefinition.body).eql({...expectedRegisterBody, name: 'create_payment'});
        });
    });

    describe('validations', function () {
        it('when delete non exist definition - should return 404', async function () {
            let deleteResponse = await requestSender.deleteDsl(dslName, 'create_payment');
            should(deleteResponse.statusCode).eql(404, JSON.stringify(deleteResponse.body));
            should(deleteResponse.body).eql({'message': 'Not found'}, JSON.stringify(deleteResponse.body));
        });

        it('when update non exist definition  - should return 404', async function () {
            const updateResponse = await requestSender.updateDsl(dslName, 'not-exist', registerRequest);
            should(updateResponse.statusCode).eql(404, JSON.stringify(updateResponse.body));
        });

        it('when get non exist definition  - should return 404', async function () {
            const updateResponse = await requestSender.getDsl(dslName, 'not-exist');
            should(updateResponse.statusCode).eql(404, JSON.stringify(updateResponse.body));
        });

        [{name: 'create', func: requestSender.createDsl},
            {name: 'put', func: requestSender.updateDsl}]
            .forEach(function (scenario) {
                describe(`${scenario.name} definition`, function () {
                    if (scenario.name === 'create'){
                        it('missing definition name - should return 400', async function () {
                            const createDslResponse = await scenario.func(dslName, undefined, createPaymentRequest);
                            should(createDslResponse.statusCode).eql(400, JSON.stringify(createDslResponse.body));
                            should(createDslResponse.body).eql({
                                'message': 'Input validation error',
                                'validation_errors': [
                                    "body should have required property 'name'"
                                ]
                            });
                        });
                    }
                    it('missing definition request - should return 400', async function () {
                        const createDslResponse = await scenario.func(dslName, 'create_payment');
                        should(createDslResponse.statusCode).eql(400, JSON.stringify(createDslResponse.body));
                        should(createDslResponse.body).eql({
                            'message': 'Input validation error',
                            'validation_errors': [
                                "body should have required property 'request'"
                            ]
                        });
                    });
                    it('request contains more than one key - post and put', async function () {
                        const createPaymentRequest = generateCreatePaymentRequest();
                        createPaymentRequest.get = createPaymentRequest.post;
                        const createDslResponse = await scenario.func(dslName, 'create_payment', createPaymentRequest);
                        should(createDslResponse.statusCode).eql(400, JSON.stringify(createDslResponse.body));
                        should(createDslResponse.body).eql({
                            'message': 'Input validation error',
                            'validation_errors': [
                                'body request should have only one of properties: get,head,post,put,delete,connect,options,trace'
                            ]
                        });
                    });
                    it('request contains one key which is no http method', async function () {
                        const createDslResponse = await scenario.func(dslName, 'create_payment', {zoozMethod: createPaymentRequest.post});
                        should(createDslResponse.body).eql({
                            'message': 'Input validation error',
                            'validation_errors': [
                                'body request should have only one of properties: get,head,post,put,delete,connect,options,trace'
                            ]
                        });
                    });
                    it('request is empty object', async function () {
                        const createDslResponse = await scenario.func(dslName, 'create_payment', {});
                        should(createDslResponse.body).eql({
                            'message': 'Input validation error',
                            'validation_errors': [
                                'body request should have only one of properties: get,head,post,put,delete,connect,options,trace'
                            ]
                        });
                    });

                    it('headers which is no key value', async function () {
                        const createPaymentRequest = generateCreatePaymentRequest();
                        createPaymentRequest.post.headers = {
                            key: 'value',
                            key2: {
                                key: '1'
                            }
                        };
                        let createDslResponse = await scenario.func(dslName, 'create_payment', createPaymentRequest);
                        should(createDslResponse.statusCode).eql(400, JSON.stringify(createDslResponse.body));
                        should(createDslResponse.body).eql({
                            'message': 'Input validation error',
                            'validation_errors': [
                                "body/request['post'].headers['key2'] should be string"
                            ]
                        });
                    });
                });
            });
    });
});

const createPaymentRequest = generateCreatePaymentRequest();
function generateCreatePaymentRequest() {
    return {
        'post': {
            'url': '/payments',
            'capture': {
                'json': '$.id',
                'as': 'paymentId'
            },
            'headers': {
                'Content-Type': 'application/json'
            },
            'json': {
                'currency': 'USD',
                'amount': 5
            }
        }
    };
}
const registerRequest = {
    'post': {
        'url': '/register',
        'capture': {
            'json': '$.id',
            'as': 'userId'
        },
        'headers': {
            'Content-Type': 'application/json'
        },
        'json': {
            'username': 'user-123',
            'password': 'gggggg'
        }
    }
};

const expectedRegisterBody = {
    'name': 'register',
    'request': {
        'post': {
            'capture': {
                'as': 'userId',
                'json': '$.id'
            },
            'headers': {
                'Content-Type': 'application/json'
            },
            'json': {
                'password': 'gggggg',
                'username': 'user-123'
            },
            'url': '/register'
        }
    }
};
const expectedCreatePaymentBody = {
    'name': 'create_payment',
    'request': {
        'post': {
            'capture': {
                'as': 'paymentId',
                'json': '$.id'
            },
            'headers': {
                'Content-Type': 'application/json'
            },
            'json': {
                'amount': 5,
                'currency': 'USD'
            },
            'url': '/payments'
        }
    }
};
const expectedGetDefinitionsResponse = [
    {
        'name': 'create_payment',
        'request': {
            'post': {
                'capture': {
                    'as': 'paymentId',
                    'json': '$.id'
                },
                'headers': {
                    'Content-Type': 'application/json'
                },
                'json': {
                    'amount': 5,
                    'currency': 'USD'
                },
                'url': '/payments'
            }
        }
    },
    {
        'name': 'register',
        'request': {
            'post': {
                'capture': {
                    'as': 'userId',
                    'json': '$.id'
                },
                'headers': {
                    'Content-Type': 'application/json'
                },
                'json': {
                    'password': 'gggggg',
                    'username': 'user-123'
                },
                'url': '/register'
            }
        }
    }
];