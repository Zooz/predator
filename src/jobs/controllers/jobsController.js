'use strict';
const { ZipArchive } = require('archiver');
const jobManager = require('../models/jobManager');

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
    const shouldGetAllJobs = (req.query && (req.query.one_time === true || req.query.one_time === 'true'));
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
    return jobManager.stopRun(req.params.job_id, req.params.report_id)
        .then(function () {
            return res.status(204).json();
        })
        .catch(function (err) {
            return next(err);
        });
};

module.exports.getLogs = async function (req, res, next) {
    try {
        const { files, filename } = await jobManager.getLogs(req.params.job_id, req.params.report_id);
        res.attachment(filename);
        const archive = new ZipArchive();
        archive.on('error', next);
        archive.pipe(res);
        files.forEach(file => archive.append(asZipEntry(file.content), { name: file.name }));
        await archive.finalize();
    } catch (err) {
        next(err);
    }
};

module.exports.deleteAllContainers = function (req, res, next) {
    return jobManager.deleteAllContainers()
        .then(function (result) {
            return res.status(200).json(result);
        })
        .catch(function (err) {
            return next(err);
        });
};

// Runner logs are normally plain text, but a job platform can hand back a parsed JSON body.
// archiver only accepts a string/Buffer/stream, so coerce anything else rather than 500.
function asZipEntry(content) {
    if (typeof content === 'string' || Buffer.isBuffer(content)) {
        return content;
    }
    return content === undefined || content === null ? '' : JSON.stringify(content);
}
