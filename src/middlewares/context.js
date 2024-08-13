const asyncLocalStorage = require('../common/context/contextStorage');
const { CONTEXT_ID } = require('../common/consts');

module.exports.middleware = (req, res, next) => {
    const contextId = req.get('x-context-id') || undefined;

    asyncLocalStorage.run(() => {
        asyncLocalStorage.setStore({ [CONTEXT_ID]: contextId });
        next();
    });
};
