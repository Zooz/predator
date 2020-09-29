'use strict';
const express = require('express');
const router = express.Router();
const metrics = require('express-node-metrics').metrics;

router.get('/', function (req, res) {
    res.json(JSON.parse(metrics.getAll(req.query.reset)));
});

module.exports = router;