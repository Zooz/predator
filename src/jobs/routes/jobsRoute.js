'use strict';

let swaggerValidator = require('express-ajv-swagger-validation');
let express = require('express');
let router = express.Router();

let jobs = require('../controllers/jobsController');
let jobVerifier = require('../helpers/jobVerifier');

router.post('/', swaggerValidator.validate, jobVerifier.verifyJobBody, jobVerifier.verifyTestExists, jobs.createJob);
router.get('/', swaggerValidator.validate, jobs.getJobs);
router.get('/:job_id', swaggerValidator.validate, jobs.getJob);
router.put('/:job_id', swaggerValidator.validate, jobVerifier.verifyTestExists, jobs.updateJob);
router.delete('/:job_id', swaggerValidator.validate, jobs.deleteJob);
router.post('/:job_id/runs/:run_id/stop', swaggerValidator.validate, jobs.stopRun);
router.get('/:job_id/runs/:run_id/logs', swaggerValidator.validate, jobs.getLogs);

module.exports = router;