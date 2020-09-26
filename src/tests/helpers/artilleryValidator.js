const consts = require('../../common/consts');
const JSCK = require('jsck');
JSCK.Draft4 = JSCK.draft4;
const artilleryCheck = new JSCK.Draft4(require('artillery/core/lib/schemas/artillery_test_script'));

module.exports = {
    verifyArtillery
};

function verifyArtillery(req, res, next) {
    const body = req.body;
    if (body.type === consts.TEST_TYPE_BASIC) {
        const validationOutput = artilleryCheck.validate(body.artillery_test);
        if (!validationOutput.valid) {
            const error = new Error('The artillery json is not valid. Errors: ' + validationOutput.errors.map(error => error.description));
            error.statusCode = 400;
            return next(error);
        }
    }

    next();
}
