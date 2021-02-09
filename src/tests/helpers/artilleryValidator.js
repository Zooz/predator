const consts = require('../../common/consts');
const JSCK = require('jsck');
const artilleryCheck = new JSCK.draft4(require('artillery/core/lib/schemas/artillery_test_script'));

module.exports = {
    verifyArtillery
};

function verifyArtillery(req, res) {
    const body = req.body;
    if (body.type === consts.TEST_TYPE_BASIC) {
        const validationOutput = artilleryCheck.validate(body.artillery_test);
        if (!validationOutput.valid) {
            const error = new Error("The artillery json is not valid. Errors: " + validationOutput.errors.map(error => error.description));
            error.statusCode = 400;
            throw error;
        }
    }
}
