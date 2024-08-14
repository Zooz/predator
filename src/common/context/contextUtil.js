const asyncLocalStorage = require('./contextStorage');
const { CONTEXT_ID } = require('../consts');

const getContextId = () => {
    const context = asyncLocalStorage.getStore();
    return context ? context[CONTEXT_ID] : undefined;
};

module.exports = {
    getContextId
};
