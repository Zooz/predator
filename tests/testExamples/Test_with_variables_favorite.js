module.exports = function (dslName) {
    return {
        name: 'test',
        description: 'test',
        type: 'dsl',
        is_favorite: true,
        scenarios: [
            {
                scenario_name: 'Scenario',
                steps: [
                    {
                        action: `${dslName}.createToken`,
                        properties: { 'billing_address.first_name': ['dina', 'niv'], 'billing_address.last_name': ['eli', 'sagiv'] }
                    },
                    {
                        action: `${dslName}.createCustomer`,
                        properties: { email: ['eshed@zooz.com', 'manor@zooz.com'] }
                    },
                    {
                        action: `${dslName}.createCustomer`
                    }
                ]
            }
        ]
    };
};