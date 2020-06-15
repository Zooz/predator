'use strict';

let swaggerValidator = require('express-ajv-swagger-validation');
let express = require('express');
let router = express.Router();

let webhooksController = require('../controllers/webhooksController');

router.get('/', swaggerValidator.validate, webhooksController.getAllWebhooks);

module.exports = router;
