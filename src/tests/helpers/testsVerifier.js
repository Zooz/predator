'use strict';
const processorsManager = require('../../processors/models/processorsManager');

module.exports.verifyProcessorExists = async (req, res, next) => {
    let errorToThrow;
    let jobBody = req.body;
    if (jobBody.processor_id) {
        try {
            await processorsManager.getProcessor(jobBody.processor_id);
        } catch (error) {
            if (error.statusCode === 404) {
                errorToThrow = new Error(`processor with id: ${jobBody.processor_id} does not exist`);
                errorToThrow.statusCode = 400;
            } else {
                errorToThrow = new Error(error.message);
                errorToThrow.statusCode = 500;
            }
        }
    }
    next(errorToThrow);
};