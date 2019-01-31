'use strict';

let logger = require('../../common/logger');
let jobManager = require('../models/jobManager');

module.exports.createJob = function(req, res) {
    return jobManager.createJob(req.body)
        .then(function(result){
            return res.status(201).json(result);
        })
        .catch(function(err){
            return handleError(err, res);
        });
};

module.exports.getJobs = function(req, res) {
    let shouldGetAllJobs = (req.query && (req.query.one_time === true || req.query.one_time === 'true'));
    return jobManager.getJobs(shouldGetAllJobs)
        .then(function(result) {
            return res.status(200).json(result);
        })
        .catch(function(err){
            return handleError(err, res);
        });
};

module.exports.getJob = function(req, res) {
    return jobManager.getJob(req.params.job_id)
        .then(function(result) {
            return res.status(200).json(result);
        })
        .catch(function(err){
            return handleError(err, res);
        });
};

module.exports.updateJob = function(req, res) {
    return jobManager.updateJob(req.params.job_id, req.body)
        .then(function(result) {
            return res.status(200).json(result);
        })
        .catch(function(err){
            return handleError(err, res);
        });
};

module.exports.deleteJob = function(req, res) {
    return jobManager.deleteJob(req.params.job_id)
        .then(function(){
            return res.status(200).json();
        })
        .catch(function(err){
            return handleError(err, res);
        });
};

module.exports.stopRun = function(req, res) {
    return jobManager.stopRun(req.params.job_id, req.params.run_id)
        .then(function(){
            return res.status(200).json();
        })
        .catch(function(err){
            return handleError(err, res);
        });
};

function handleError(err, res) {
    if (err.statusCode) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    if (err.message === 'Error' || err.message === '' || err.message === undefined) {
        err.message = 'Internal error occurred';
    }
    logger.error(err.message);
    return res.status(500).json({ message: err.message });
}
