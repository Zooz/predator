'use strict';

let logger = require('../../common/logger');
let manager = require('../models/manager');

module.exports.upsertTest = function(req, res) {
    return manager.upsertTest(req.body, req.params.test_id)
        .then(function(result){
            return res.status(201).json(result);
        })
        .catch(function(err){
            if (err.statusCode) {
                return res.status(err.statusCode).json({message: err.message});
            }
            return handleError(err, res);
        });
};

module.exports.getTest = function(req, res) {
    return manager.getTest(req.params.test_id)
        .then(function(result){
            if (!result) {
                return res.status(404).json({message: 'Not found'});
            }
            return res.status(200).json(result);
        })
        .catch(function(err){
            return handleError(err, res);
        });
};

module.exports.deleteTest = function(req, res) {
    return manager.deleteTest(req.params.test_id, req.body)
        .then(function(result){
            return res.status(200).json();
        })
        .catch(function(err){
            return handleError(err, res);
        });
};

module.exports.getTests = function(req, res) {
    return manager.getTests()
        .then(function(result){
            return res.status(200).json(result);
        })
        .catch(function(err){
            return handleError(err, res);
        });
};

module.exports.getTestRevisions = function(req, res) {
    return manager.getAllTestRevision(req.params.test_id)
        .then(function(result){
            if (!result) {
                return res.status(404).json({message: 'Not found'});
            }

            return res.status(200).json(result);
        })
        .catch(function(err){
            return handleError(err, res);
        });
};

function handleError(err, res) {
    if (err.message === 'Error' || err.message === '' || err.message === undefined) {
        err.message = 'Internal error occurred';
    }
    logger.error(err);
    return res.status(500).json({message: err.message});
}