'use strict';

const swaggerValidator = require('express-ajv-swagger-validation');
const express = require('express');
const router = express.Router();

const jobs = require('../controllers/jobsController');
const jobVerifier = require('../helpers/jobVerifier');

router.post('/', swaggerValidator.validate, jobVerifier.verifyJobBody, jobVerifier.verifyTestExists, jobVerifier.verifyExperimentsExist, jobs.createJob);
router.get('/', swaggerValidator.validate, jobs.getJobs);
router.get('/:job_id', swaggerValidator.validate, jobs.getJob);
router.put('/:job_id', swaggerValidator.validate, jobVerifier.verifyTestExists, jobVerifier.verifyExperimentsExist, jobs.updateJob);
router.delete('/:job_id', swaggerValidator.validate, jobs.deleteJob);
router.post('/:job_id/runs/:report_id/stop', swaggerValidator.validate, jobs.stopRun);
router.get('/:job_id/runs/:report_id/logs', swaggerValidator.validate, jobs.getLogs);
router.delete('/runs/containers', jobs.deleteAllContainers);

module.exports = router;
