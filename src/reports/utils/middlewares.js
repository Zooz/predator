
const reportManager = require('../models/reportsManager');

module.exports.verifyReportIDInRoute = async function(req, res) {
    let errorToThrow;
    const reportId = req.params.report_id;
    const testId = req.params.test_id;
    try {
        await reportManager.getReport(testId, reportId);
    } catch (error) {
        if (error.statusCode === 404) {
            errorToThrow = error;
        } else {
            errorToThrow = new Error(error.message);
            errorToThrow.statusCode = 500;
        }
        throw errorToThrow
    }
};
