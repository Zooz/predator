const httpContext = require('express-http-context');

const {
    CONTEXT_ID
} = require('../common/consts');

module.exports.middleware = (req, res, next) => {
    const contextId = req.get('x-context-id');
    if (contextId) {
        httpContext.set(CONTEXT_ID, contextId);
    }
    next();
};
