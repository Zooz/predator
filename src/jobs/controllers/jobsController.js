'use strict';
let jobManager = require('../models/jobManager');

module.exports.createJob = function (req, res, next) {
    return jobManager.createJob(req.body)
        .then(function (result) {
            return res.status(201).json(result);
        })
        .catch(function (err) {
            return next(err);
        });
};

module.exports.getJobs = function (req, res, next) {
    let shouldGetAllJobs = (req.query && (req.query.one_time === true || req.query.one_time === 'true'));
    return jobManager.getJobs(shouldGetAllJobs)
        .then(function (result) {
            return res.status(200).json(result);
        })
        .catch(function (err) {
            return next(err);
        });
};

module.exports.getJob = function (req, res, next) {
    return jobManager.getJob(req.params.job_id)
        .then(function (result) {
            return res.status(200).json(result);
        })
        .catch(function (err) {
            return next(err);
        });
};

module.exports.updateJob = function (req, res, next) {
    return jobManager.updateJob(req.params.job_id, req.body)
        .then(function (result) {
            return res.status(200).json(result);
        })
        .catch(function (err) {
            return next(err);
        });
};

module.exports.deleteJob = function (req, res, next) {
    return jobManager.deleteJob(req.params.job_id)
        .then(function () {
            return res.status(204).json();
        })
        .catch(function (err) {
            return next(err);
        });
};

module.exports.stopRun = function (req, res, next) {
    return jobManager.stopRun(req.params.job_id, req.params.run_id)
        .then(function () {
            return res.status(204).json();
        })
        .catch(function (err) {
            return next(err);
        });
};

module.exports.getLogs = function (req, res, next) {
    return jobManager.getLogs(req.params.job_id, req.params.run_id)
        .then(function (result) {
            return res.zip(result);
        }).catch(function (err) {
            return next(err);
        });
};

module.exports.deleteAllContainers = function (req, res, next) {
    return jobManager.deleteAllContainers()
        .then(function (result) {
            return res.status(204).json(result);
        })
        .catch(function (err) {
            return next(err);
        });
};