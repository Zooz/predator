'use strict';

let express = require('express');
let swaggerValidator = require('express-ajv-swagger-validation');
let router = express.Router();

let config = require('../controllers/configController');

router.put('/', swaggerValidator.validate, config.updateConfig);
router.get('/', config.getConfig);
module.exports = router;