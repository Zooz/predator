module.exports = function (dslName) {
    return {
        name: 'test',
        description: 'test',
        type: 'dsl',
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
                ],
                weight: 90
            },
            {
                scenario_name: 'Scenario',
                steps: [
                    {
                        action: `${dslName}.createToken`
                    },
                    {
                        action: `${dslName}.getToken`
                    }
                ],
                weight: 20
            }
        ]
    };
};