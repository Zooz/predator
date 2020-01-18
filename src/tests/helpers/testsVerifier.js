'use strict';
const processorsManager = require('../../processors/models/processorsManager');
const consts = require('../../common/consts');
const _ = require('lodash');
module.exports.verifyProcessorIsValid = async (req, res, next) => {
    let errorToThrow;
    let processor;
    let usedFunctions = [];

    getUsedFunctions(req.body.artillery_test, usedFunctions);

    let testBody = req.body;
    if (testBody.processor_id) {
        try {
            processor = await processorsManager.getProcessor(testBody.processor_id);
        } catch (error) {
            if (error.statusCode === 404) {
                errorToThrow = new Error(`processor with id: ${testBody.processor_id} does not exist`);
                errorToThrow.statusCode = 400;
            } else {
                errorToThrow = new Error(error.message);
                errorToThrow.statusCode = 500;
            }
        }

        if (!errorToThrow) {
            let usedFunctionsWhichNotExists = usedFunctions.filter(uf => !processor.exported_functions.includes(uf));
            usedFunctionsWhichNotExists = _.uniq(usedFunctionsWhichNotExists);
            if (usedFunctionsWhichNotExists.length > 0) {
                errorToThrow = new Error(`Functions: ${usedFunctionsWhichNotExists.join(', ')} does not exist in the processor file`);
                errorToThrow.statusCode = 400;
            }
        }
    } else if (usedFunctions.length > 0 && testBody.type === consts.TEST_TYPE_BASIC) {
        errorToThrow = new Error(`Functions: ${usedFunctions.join(', ')} are used without specifying processor`);
        errorToThrow.statusCode = 400;
    }
    next(errorToThrow);
};

function getUsedFunctions(obj, functions) {
    for (let key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            getUsedFunctions(obj[key], functions);
        } else if (consts.PROCESSOR_FUNCTIONS_KEYS.includes(key)) {
            functions.push(obj[key]);
        }
    }
}
