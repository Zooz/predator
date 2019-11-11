'use strict';

let swaggerValidator = require('express-ajv-swagger-validation');
let express = require('express');
let router = express.Router();

let processors = require('../controllers/processorController');

router.get('/', swaggerValidator.validate, processors.getAllProcessors);
router.post('/', swaggerValidator.validate, processors.createProcessor);
router.post('/:processor_id/download', swaggerValidator.validate, processors.updateDownloadJSProcessor);
router.get('/:processor_id', swaggerValidator.validate, processors.getProcessor);
router.delete('/:processor_id', swaggerValidator.validate, processors.deleteProcessor);

module.exports = router;
