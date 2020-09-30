module.exports = function (dslName) {
    const result = {
        config: {
            target: '',
            http: {
                pool: 100
            },
            phases: [{
                duration: 0,
                arrivalRate: 0,
                rampTo: 0
            }],
            variables: {}
        },
        scenarios: [{
            name: 'Scenario',
            flow: [{
                post: {
                    url: '/tokens',
                    gzip: true,
                    forever: true,
                    capture: [{
                        json: '$.token',
                        as: 'tokenId'
                    }],
                    headers: {
                        'x-payments-os-env': 'test',
                        'Content-Type': 'application/json'
                    },
                    json: {
                        token_type: 'credit_card',
                        holder_name: 'MY NAME',
                        expiration_date: '11/2020',
                        card_number: '4580458045804580',
                        identity_document: {
                            number: '5415668464654',
                            type: 'ID'
                        },
                        billing_address: {
                            first_name: `{{ 0_0_${dslName}.createToken_billing_address_first_name }}`,
                            last_name: `{{ 0_0_${dslName}.createToken_billing_address_last_name }}`,
                            country: 'ARG',
                            line1: 'Viamonte',
                            line2: '1366',
                            city: 'Plata',
                            phone: '7563126',
                            state: 'Buenos Aires',
                            zip_code: '64000'
                        }
                    }
                }
            }, {
                post: {
                    url: '/customers',
                    gzip: true,
                    forever: true,
                    capture: [{
                        json: '$.id',
                        as: 'customerId'
                    }],
                    headers: {
                        'x-payments-os-env': 'test',
                        'Content-Type': 'application/json'
                    },
                    json: {
                        customer_reference: '{{ $randomString() }}',
                        email: `{{ 0_1_${dslName}.createCustomer_email }}`
                    }
                }
            },
            {
                post: {
                    url: '/customers',
                    gzip: true,
                    forever: true,
                    capture: [{
                        json: '$.id',
                        as: 'customerId'
                    }],
                    headers: {
                        'x-payments-os-env': 'test',
                        'Content-Type': 'application/json'
                    },
                    json: {
                        customer_reference: '{{ $randomString() }}',
                        email: 'test@gmail.com'
                    }
                }
            }
            ],
            weight: 100
        }]
    };

    result.config.variables[`0_0_${dslName}.createToken_billing_address_first_name`] = ['dina', 'niv'];
    result.config.variables[`0_0_${dslName}.createToken_billing_address_last_name`] = ['eli', 'sagiv'];
    result.config.variables[`0_1_${dslName}.createCustomer_email`] = ['eshed@zooz.com', 'manor@zooz.com'];

    return result;
};