module.exports = (dslName) => {
    return [
        {
            'artillery_test': {
                'config': {
                    'http': {
                        'pool': 100
                    },
                    'phases': [
                        {
                            'arrivalRate': 0,
                            'duration': 0,
                            'rampTo': 0
                        }
                    ],
                    'target': '',
                    'variables': {}
                },
                'scenarios': [
                    {
                        'flow': [
                            {
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
                            },
                            {
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
                        ],
                        'name': 'Scenario',
                        'weight': 100
                    }
                ]
            },
            'description': 'test',
            'name': 'test',
            'raw_data': {
                'description': 'test',
                'name': 'test',
                'scenarios': [
                    {
                        'scenario_name': 'Scenario',
                        'steps': [
                            {
                                'action': `${dslName}.createToken`
                            },
                            {
                                'action': `${dslName}.createCustomer`
                            }
                        ]
                    }
                ],
                'type': 'dsl'
            },
            'type': 'dsl'
        },
        {
            'artillery_test': {
                'config': {
                    'http': {
                        'pool': 100
                    },
                    'phases': [
                        {
                            'arrivalRate': 0,
                            'duration': 0,
                            'rampTo': 0
                        }
                    ],
                    'target': '',
                    'variables': {}
                },
                'scenarios': [
                    {
                        'flow': [
                            {
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
                            },
                            {
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
                        ],
                        'name': 'Scenario',
                        'weight': 50
                    },
                    {
                        'flow': [
                            {
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
                            },
                            {
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
                        ],
                        'name': 'Scenario',
                        'weight': 50
                    }
                ]
            },
            'description': 'test',
            'name': 'test',
            'raw_data': {
                'description': 'test',
                'name': 'test',
                'scenarios': [
                    {
                        'scenario_name': 'Scenario',
                        'steps': [
                            {
                                'action': `${dslName}.createToken`
                            },
                            {
                                'action': `${dslName}.createCustomer`
                            }
                        ]
                    },
                    {
                        'scenario_name': 'Scenario',
                        'steps': [
                            {
                                'action': `${dslName}.createToken`
                            },
                            {
                                'action': `${dslName}.createCustomer`
                            }
                        ]
                    }
                ],
                'type': 'dsl'
            },
            'type': 'dsl'
        }
    ];
};
