module.exports = (dslName) => {
    return [
        {
            description: 'test',
            name: 'test',
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
            ],
            type: 'dsl',
            is_favorite: false
        },
        {
            description: 'test',
            name: 'test',
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
                },
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
            ],
            type: 'dsl',
            is_favorite: false
        }
    ];
};
