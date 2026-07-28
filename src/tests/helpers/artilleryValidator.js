const consts = require('../../common/consts');
const JSCK = require('jsck');
JSCK.Draft4 = JSCK.draft4;
// ponytail: schema vendored from artillery@1.7.9 core/lib/schemas/artillery_test_script.json.
// The whole artillery package (and its vulnerable dep tree) was only ever required for this one file.
const artilleryCheck = new JSCK.Draft4(require('./artillery-test-script.schema.json'));

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
