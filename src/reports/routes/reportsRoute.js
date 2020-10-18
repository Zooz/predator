'use strict';
const swaggerValidator = require('express-ajv-swagger-validation');
const express = require('express');
const router = express.Router();
const { verifyReportIDInRoute } = require('../utils/middlewares');
const reports = require('../controllers/reportsController');

router.get('/:test_id/reports/:report_id/aggregate', swaggerValidator.validate, reports.getAggregateReport);
router.get('/:test_id/reports/:report_id', swaggerValidator.validate, reports.getReport);
router.put('/:test_id/reports/:report_id', swaggerValidator.validate, verifyReportIDInRoute, reports.editReport);
router.delete('/:test_id/reports/:report_id', swaggerValidator.validate, verifyReportIDInRoute, reports.deleteReport);
router.get('/:test_id/reports/', swaggerValidator.validate, reports.getReports);
router.get('/last_reports/', swaggerValidator.validate, reports.getLastReports);
router.post('/:test_id/reports/:report_id/subscribe', swaggerValidator.validate, reports.subscribeRunnerToReport);
router.post('/:test_id/reports/:report_id/stats', swaggerValidator.validate, reports.postStats);
router.get('/:test_id/reports/:report_id/export/:file_format', swaggerValidator.validate, reports.getExportedReport);
router.get('/reports/compare/export/:file_format', swaggerValidator.validate, reports.getExportedCompareReport);
module.exports = router;
