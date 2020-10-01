
module.exports = function (dslName) {
    return {
        test: {
            name: 'test',
            description: 'test',
            type: 'dsl',
            before: {
                steps: [
                    {
                        action: `${dslName}.createAuthorize`,
                        properties: {
                            credit_card_cvv: ['123', '568']
                        }
                    }
                ]
            },
            scenarios: [
                {
                    scenario_name: 'Scenario',
                    steps: [
                        {
                            action: `${dslName}.createToken`
                        },
                        {
                            action: `${dslName}.createCustomer`
                        }
                    ]
                }
            ]
        }
    };
};