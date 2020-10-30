'use strict';

const swaggerValidator = require('express-ajv-swagger-validation');
const express = require('express');
const router = express.Router();

const webhooksController = require('../controllers/webhooksController');

router.get('/', swaggerValidator.validate, webhooksController.getAllWebhooks);
router.post('/', swaggerValidator.validate, webhooksController.createWebhook);
router.get('/:webhook_id', swaggerValidator.validate, webhooksController.getWebhook);
router.post('/:webhook_id/test', swaggerValidator.validate, webhooksController.testWebhook);
router.delete('/:webhook_id', swaggerValidator.validate, webhooksController.deleteWebhook);
router.put('/:webhook_id', swaggerValidator.validate, webhooksController.updateWebhook);

module.exports = router;
