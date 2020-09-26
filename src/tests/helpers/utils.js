const get = require('lodash.get');

module.exports = {
    addDefaultsToTest,
    addDefaultsToStep
};

function addDefaultsToTest(artilleryTest) {
    const scenarios = get(artilleryTest, 'scenarios', []);
    for (const scenario of scenarios){
        const flow = get(scenario, 'flow', []);
        for (const step of flow){
            addDefaultsToStep(step);
        }
    }

    const before = get(artilleryTest, 'before.flow', []);
    for (const step of before){
        addDefaultsToStep(step);
    }
    return artilleryTest;
}

function addDefaultsToStep(step) {
    if (step){
        const method = Object.keys(step)[0];
        if (method){
            step[method].url = step[method].url || '/';
        }
    }
    return step;
}
