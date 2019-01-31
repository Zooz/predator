module.exports = function (dslName) {
    return {
        'name': 'test',
        'description': 'TEST',
        'type': 'dsl',
        'scenarios': [
            {
                'scenario_name': 'Scenario',
                'steps': [
                    {
                        'action': `${dslName}.createToken`
                    },
                    {
                        'action': `${dslName}.createAuthorize`
                    },
                    {
                        'action': `${dslName}.getToken`
                    }
                ]
            }
        ]
    };
};