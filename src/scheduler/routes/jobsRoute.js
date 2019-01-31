'use strict';

let swaggerValidator = require('express-ajv-swagger-validation');
let express = require('express');
let router = express.Router();

let jobs = require('../controllers/jobsController');
let jobVerifier = require('../helpers/jobVerifier');

router.post('/v1/jobs', swaggerValidator.validate, jobVerifier.verifyJobBody, jobVerifier.verifyTestExists, jobs.createJob);
router.get('/v1/jobs', swaggerValidator.validate, jobs.getJobs);
router.get('/v1/jobs/:job_id', swaggerValidator.validate, jobs.getJob);
router.put('/v1/jobs/:job_id', swaggerValidator.validate, jobVerifier.verifyTestExists, jobs.updateJob);
router.delete('/v1/jobs/:job_id', swaggerValidator.validate, jobs.deleteJob);
router.post('/v1/jobs/:job_id/runs/:run_id/stop', swaggerValidator.validate, jobs.stopRun);

module.exports = router;