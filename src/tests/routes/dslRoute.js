'use strict';

const express = require('express'),
    router = express.Router(),
    dsl = require('../controllers/dslController'),
    swaggerValidator = require('express-ajv-swagger-validation'),
    customValidation = require('../middlewares/customValidation');

router.post('/:dsl_name/definitions', swaggerValidator.validate, customValidation.createDslValidator, dsl.createDefinition);
router.get('/:dsl_name/definitions', swaggerValidator.validate, dsl.getDslDefinitions);
router.get('/:dsl_name/definitions/:definition_name', swaggerValidator.validate, dsl.getDslDefinition);
router.put('/:dsl_name/definitions/:definition_name', swaggerValidator.validate, customValidation.createDslValidator, dsl.updateDefinition);
router.delete('/:dsl_name/definitions/:definition_name', swaggerValidator.validate, dsl.deleteDefinition);
module.exports = router;