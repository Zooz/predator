'use strict';

let express = require('express');
let router = express.Router();
let tests = require('../controllers/testsController');
let swaggerValidator = require('express-ajv-swagger-validation');
let artilleryValidator = require('../helpers/artilleryValidator');
let testsVerifier = require('../helpers/testsVerifier');

router.post('/', swaggerValidator.validate, testsVerifier.verifyProcessorExists, artilleryValidator.verifyArtillery, tests.upsertTest);
router.get('/', swaggerValidator.validate, tests.getTests);
router.get('/:test_id', swaggerValidator.validate, tests.getTest);
router.delete('/:test_id', swaggerValidator.validate, tests.deleteTest);
router.get('/file/:file_id', swaggerValidator.validate, tests.getFile);
router.put('/:test_id', swaggerValidator.validate, testsVerifier.verifyProcessorExists, artilleryValidator.verifyArtillery, tests.upsertTest);
router.get('/:test_id/revisions', swaggerValidator.validate, tests.getTestRevisions);
module.exports = router;