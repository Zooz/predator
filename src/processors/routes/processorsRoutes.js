'use strict';
const swaggerValidator = require('express-ajv-swagger-validation');
const express = require('express');
const router = express.Router();

const processorsController = require('../controllers/processorsController');

router.get('/', swaggerValidator.validate, processorsController.getAllProcessors);

module.exports = router;
