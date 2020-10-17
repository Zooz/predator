'use strict';

const express = require('express');
const router = express.Router();
const contextsController = require('../controllers/contextsController');
const swaggerValidator = require('express-ajv-swagger-validation');

router.post('/', swaggerValidator.validate, contextsController.createContext);
router.get('/', swaggerValidator.validate, contextsController.getContexts);
router.delete('/', swaggerValidator.validate, contextsController.deleteContext);

module.exports = router;
