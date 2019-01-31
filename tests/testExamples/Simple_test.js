
module.exports = function (dslName) {
    return {
        'test': {
            'name': 'test',
            'description': 'test',
            'type': 'dsl',
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
            ]
        }
    };
};