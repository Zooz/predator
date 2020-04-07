'use strict';

let express = require('express');
let router = express.Router();
let filesController = require('../controllers/filesController');
let swaggerValidator = require('express-ajv-swagger-validation');

router.post('/', filesController.saveFile);
router.get('/:file_id', swaggerValidator.validate, filesController.getFile);
module.exports = router;
