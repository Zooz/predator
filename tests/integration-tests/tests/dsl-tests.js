module.exports = {
    beforeRequest,
    afterResponse,
    afterScenario,
    beforeScenario
};

function beforeRequest(requestParams, context, ee, next) {
    return next(); // MUST be called for the scenario to continue
}

function afterResponse(requestParams, response, context, ee, next) {
    return next(); // MUST be called for the scenario to continue
}

function afterScenario(context, ee, next) {
    return next(); // MUST be called for the scenario to continue
}

function beforeScenario(context, ee, next) {
    return next(); // MUST be called for the scenario to continue
}
