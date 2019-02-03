let consts = require('../../common/consts');
let JSCK = require('jsck');
JSCK.Draft4 = JSCK.draft4;
let artilleryCheck = new JSCK.Draft4(require('artillery/core/lib/schemas/artillery_test_script'));

module.exports = {
    verifyArtillery
};

function verifyArtillery(req, res, next) {
    let body = req.body;
    if (body.type === consts.TEST_TYPE_CUSTOM) {
        let validationOutput = artilleryCheck.validate(body.artillery_test);
        if (!validationOutput.valid) {
            return res.status(400).json({message: 'The artillery json is not valid. Errors: ' + validationOutput.errors.map(error => error.description)});
        }
    }

    next();
}
