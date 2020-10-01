
module.exports = function(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};
