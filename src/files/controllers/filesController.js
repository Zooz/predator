'use strict';
const stream = require('stream');
const fileManager = require('../models/fileManager');

module.exports = {
    getFile,
    saveFile,
    getFileMetadata
};

async function getFile(req, res) {
    try {
        const fileData = await fileManager.getFile(req.params.file_id, true);

        const fileContents = Buffer.from(fileData.content, 'base64');
        const readStream = new stream.PassThrough();
        readStream.end(fileContents);

        res.headers({
            'Content-disposition': 'attachment; filename=' + fileData.filename,
            'Content-Type': 'text/plain'
        });
        res.send(readStream);
    } catch (err) {
        res.code(500).send(err)
    }
}

async function getFileMetadata(req, res) {
    try {
        const fileData = await fileManager.getFile(req.params.file_id, false);
        res.code(200).send(fileData);
    } catch (err) {
        res.code(500).send(err);
    }
}

async function saveFile(req, res) {
    if (!req.files || Object.keys(req.files).length !== 1 || !req.files.csv) {
        return res.code(400).send({
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
        res.code(201).send({ id, filename: file.name });
    } catch (err){
        res.code(500).send(err);
    }
}
