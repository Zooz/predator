
module.exports = function(stautsCode, message) {
    const error = new Error(message);
    error.statusCode = stautsCode;
    return error;
};