'use strict';
const jobManager = require('../models/jobManager');

module.exports.createJob = function (req, res) {
    return jobManager.createJob(req.body)
        .then(function (result) {
            res.code(201).send(result);
        })
        .catch(function (err) {
            res.send(err);
        });
};

module.exports.getJobs = function (req, res) {
    const shouldGetAllJobs = (req.query && (req.query.one_time === true || req.query.one_time === 'true'));
    return jobManager.getJobs(shouldGetAllJobs, req.requestContext)
        .then(function (result) {
            res.code(200).send(result);
        })
        .catch(function (err) {
            res.send(err);
        });
};

module.exports.getJob = function (req, res) {
    return jobManager.getJob(req.params.job_id, req.requestContext)
        .then(function (result) {
            res.code(200).send(result);
        })
        .catch(function (err) {
            res.send(err);
        });
};

module.exports.updateJob = function (req, res) {
    return jobManager.updateJob(req.params.job_id, req.body, req.requestContext)
        .then(function (result) {
            res.code(200).send(result);
        })
        .catch(function (err) {
            res.send(err);
        });
};

module.exports.deleteJob = function (req, res) {
    return jobManager.deleteJob(req.params.job_id, req.requestContext)
        .then(function () {
            res.code(204).send();
        })
        .catch(function (err) {
            res.send(err);
        });
};

module.exports.stopRun = function (req, res) {
    return jobManager.stopRun(req.params.job_id, req.params.report_id)
        .then(function () {
            res.code(204).send();
        })
        .catch(function (err) {
            res.send(err);
        });
};

module.exports.getLogs = function (req, res) {
    return jobManager.getLogs(req.params.job_id, req.params.report_id)
        .then(function (result) {
            //TODO: fix ZIP creation
            // return res.zip(result);
        }).catch(function (err) {
            res.send(err);
        });
};

module.exports.deleteAllContainers = function (req, res) {
    return jobManager.deleteAllContainers()
        .then(function (result) {
            res.code(200).send(result);
        })
        .catch(function (err) {
            res.send(err);
        });
};
