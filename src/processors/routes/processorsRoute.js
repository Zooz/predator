'use strict';

let swaggerValidator = require('express-ajv-swagger-validation');
let express = require('express');
let router = express.Router();

let processors = require('../controllers/processorController');

router.get('/', swaggerValidator.validate, processors.getAllProcessors);
router.post('/', swaggerValidator.validate, processors.createProcessor);

module.exports = router;
