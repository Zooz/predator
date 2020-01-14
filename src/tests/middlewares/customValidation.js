const swaggerValidator = require('express-ajv-swagger-validation');
const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];
module.exports = {
    createDslValidator
};

function createDslValidator(req, res, next) {
    const request = req.body.request;
    const keys = Object.keys(request);
    const swaggerError = buildSwaggerError(req, 'request should have only one of properties: get,head,post,put,delete,connect,options,trace');
    if (keys.length === 0 || keys.length !== 1){
        return next(swaggerError);
    }

    if (!httpMethods.includes(keys[0])){
        return next(swaggerError);
    }
    return next();
}

function buildSwaggerError(req, message) {
    const error = [{ message, dataPath: '' }];
    const swaggerValidatorError = new swaggerValidator.InputValidationError(error, req.path, req.method, { beautifyErrors: true });
    let errors = swaggerValidatorError.errors.map(o => o.message);
    return { errors, message: swaggerValidatorError.message };
}
