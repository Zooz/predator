'use strict';
const stream = require('stream');
const fileManager = require('../models/fileManager');

module.exports = {
    getFile,
    saveFile,
    getFileMetadata,
    getFileByName
};

async function getFile(req, res, next) {
    try {
        const fileData = await fileManager.getFile(req.params.file_id, true);

        const fileContents = Buffer.from(fileData.content, 'base64');
        const readStream = new stream.PassThrough();
        readStream.end(fileContents);

        res.set('Content-disposition', 'attachment; filename=' + fileData.filename);
        res.set('Content-Type', 'text/plain');

        readStream.pipe(res);
    } catch (err) {
        return next(err);
    }
}

async function getFileByName(req, res, next) {
    try {
        const fileData = await fileManager.getFileByName(req.params.file_name, true);

        const fileContents = Buffer.from(fileData.content, 'base64');
        const readStream = new stream.PassThrough();
        readStream.end(fileContents);

        res.set('Content-disposition', 'attachment; filename=' + fileData.filename);
        res.set('Content-Type', 'text/plain');

        readStream.pipe(res);
    } catch (err) {
        return next(err);
    }
}

async function getFileMetadata(req, res, next) {
    try {
        const fileData = await fileManager.getFile(req.params.file_id);
        return res.json(fileData).status(200);
    } catch (err) {
        return next(err);
    }
}

async function saveFile(req, res, next) {
    if (!req.files || Object.keys(req.files).length !== 1 || !req.files.csv) {
        return res.status(400).json({
            message: 'Please upload exactly one file with key: "csv"'
        });
    }
    try {
        const file = req.files[Object.keys(req.files)[0]];
        if (file.truncated) {
            const error = new Error('Payload Too Large');
            error.statusCode = 413;
            throw error;
        }
        const id = await fileManager.saveFile(file.name, file.data);
        return res.status(201).json({ id, filename: file.name });
    } catch (err){
        return next(err);
    }
}
