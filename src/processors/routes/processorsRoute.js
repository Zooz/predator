'use strict';

const swaggerValidator = require('express-ajv-swagger-validation');
const express = require('express');
const router = express.Router();

const processors = require('../controllers/processorController');

router.get('/', swaggerValidator.validate, processors.getAllProcessors);
router.post('/', swaggerValidator.validate, processors.createProcessor);
router.get('/:processor_id', swaggerValidator.validate, processors.getProcessor);
router.delete('/:processor_id', swaggerValidator.validate, processors.deleteProcessor);
router.put('/:processor_id', swaggerValidator.validate, processors.updateProcessor);

module.exports = router;
