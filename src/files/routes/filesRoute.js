'use strict';

const express = require('express');
const router = express.Router();
const filesController = require('../controllers/filesController');
const swaggerValidator = require('express-ajv-swagger-validation');

router.post('/', filesController.saveFile);
router.get('/:file_id', swaggerValidator.validate, filesController.getFile);
router.get('/:file_id/metadata', swaggerValidator.validate, filesController.getFileMetadata);
router.get('/name/:file_name', swaggerValidator.validate, filesController.getFileByName);

module.exports = router;
