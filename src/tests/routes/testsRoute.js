'use strict';

const express = require('express');
const router = express.Router();
const tests = require('../controllers/testsController');
const swaggerValidator = require('express-ajv-swagger-validation');
const artilleryValidator = require('../helpers/artilleryValidator');
const testsVerifier = require('../helpers/testsVerifier');

router.post('/', swaggerValidator.validate, testsVerifier.verifyProcessorIsValid, artilleryValidator.verifyArtillery, tests.upsertTest);
router.get('/', swaggerValidator.validate, tests.getTests);
router.get('/:test_id', swaggerValidator.validate, tests.getTest);
router.delete('/:test_id', swaggerValidator.validate, tests.deleteTest);
router.put('/:test_id', swaggerValidator.validate, testsVerifier.verifyProcessorIsValid, artilleryValidator.verifyArtillery, tests.upsertTest);
router.post('/:test_id/benchmark', swaggerValidator.validate, testsVerifier.verifyTestExist, tests.insertTestBenchmark);
router.get('/:test_id/benchmark', swaggerValidator.validate, testsVerifier.verifyTestExist, tests.getBenchmark);
router.get('/:test_id/revisions', swaggerValidator.validate, tests.getTestRevisions);
module.exports = router;
