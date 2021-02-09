const swaggerValidator = require('openapi-validator-middleware');
const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];
module.exports = {
    createDslValidator
};

function createDslValidator(req, res) {
    const request = req.body.request;
    const keys = Object.keys(request);
    const swaggerError = buildSwaggerError(req, 'body request should have only one of properties: get,head,post,put,delete,connect,options,trace');
    if (keys.length === 0 || keys.length !== 1){
        throw swaggerError;
    }

    if (!httpMethods.includes(keys[0])){
        throw swaggerError;
    }
}

function buildSwaggerError(req, message) {
    const error = [message];
    return new swaggerValidator.InputValidationError(error, {beautifyErrors: false});
}
