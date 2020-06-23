'use strict';

let swaggerValidator = require('express-ajv-swagger-validation');
let express = require('express');
let router = express.Router();

let webhooksController = require('../controllers/webhooksController');

router.get('/', swaggerValidator.validate, webhooksController.getAllWebhooks);
router.post('/', swaggerValidator.validate, webhooksController.createWebhook);
router.get('/:webhook_id', swaggerValidator.validate, webhooksController.getWebhook);
router.delete('/:webhook_id', swaggerValidator.validate, webhooksController.deleteWebhook);
router.put('/:webhook_id', swaggerValidator.validate, webhooksController.updateWebhook);

module.exports = router;
