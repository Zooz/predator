'use strict';

const swaggerValidator = require('express-ajv-swagger-validation');
const express = require('express');
const router = express.Router();

const chaosExperiments = require('../controllers/chaosExperimentController');

router.get('/', swaggerValidator.validate, chaosExperiments.getAllChaosExperiments);
router.post('/', swaggerValidator.validate, chaosExperiments.createChaosExperiment);
router.get('/:experiment_id', swaggerValidator.validate, chaosExperiments.getChaosExperimentById);
router.put('/:experiment_id', swaggerValidator.validate, chaosExperiments.updateChaosExperiment);
router.delete('/:experiment_id', swaggerValidator.validate, chaosExperiments.deleteChaosExperiment);

module.exports = router;
