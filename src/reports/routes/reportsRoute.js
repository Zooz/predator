'use strict';

let swaggerValidator = require('express-ajv-swagger-validation');
let express = require('express');
let router = express.Router();

let reports = require('../controllers/reportsController');

router.get('/:test_id/reports/:report_id/html', swaggerValidator.validate, reports.getHtmlReport);
router.get('/:test_id/reports/:report_id/aggregate', reports.getAggregateReport);
router.get('/:test_id/reports/:report_id', swaggerValidator.validate, reports.getReport);
router.get('/:test_id/reports/', swaggerValidator.validate, reports.getReports);
router.get('/last_reports/', swaggerValidator.validate, reports.getLastReports);
router.post('/:test_id/reports/', swaggerValidator.validate, reports.postReport);
router.post('/:test_id/reports/:report_id/stats', swaggerValidator.validate, reports.postStats);

module.exports = router;