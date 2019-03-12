'use strict';

const express = require('express');
const swaggerValidator = require('express-ajv-swagger-validation');
const config = require('../controllers/configController');
const router = express.Router();

router.put('/', swaggerValidator.validate, config.updateConfig);
router.delete('/:key', config.deleteConfig);
router.get('/', config.getConfig);
router.get('/dataMap', config.getConfigDataMap);
module.exports = router;