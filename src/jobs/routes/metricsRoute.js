'use strict';
let express = require('express');
let router = express.Router();
let metrics = require('express-node-metrics').metrics;

router.get('/', function (req, res) {
    res.json(JSON.parse(metrics.getAll(req.query.reset)));
});

module.exports = router;