'use strict';

const requestCreator = require('./helpers/requestCreator');
const should = require('should');
const fs = require('fs');
const path = require('path');

const SMALL_CSV_PATH = path.join(__dirname, 'helpers', 'small.csv');
const BIG_CSV_PATH = path.join(__dirname, 'helpers', 'big.csv');

describe('Upload and download file', () => {
    before(async () => {
        await requestCreator.init();
    });

    describe('upload file', () => {
        it('simple csv upload', async () => {
            const response = await requestCreator.uploadFile('csv', SMALL_CSV_PATH);
            should(response.statusCode).eql(201);
            should(response.body.id).not.empty();
            should(response.body.filename).eql('small.csv');
        });

        it('files with keys different than csv should be rejected', async () => {
            const response = await requestCreator.uploadFile('jpeg', SMALL_CSV_PATH);
            should(response.statusCode).eql(400);
            should(response.body.message).eql('Please upload exactly one file with key: "csv"');
        });

        it('big csv upload should result in 413', async () => {
            const response = await requestCreator.uploadFile('csv', BIG_CSV_PATH);
            should(response.statusCode).eql(413);
        });
    });

    describe('download file', () => {
        it('Download not existing file', async () => {
            const response = await requestCreator.downloadFile('10bc7982-d57b-4917-a952-7a8d8d75bf92');
            should(response.statusCode).eql(404);
        });

        it('Download exiting file id', async () => {
            const response = await requestCreator.uploadFile('csv', SMALL_CSV_PATH);
            should(response.statusCode).eql(201);
            should(response.body.id).not.empty();

            const downloadedFile = await requestCreator.downloadFile(response.body.id);
            should(downloadedFile.statusCode).eql(200);

            const smallCsvDataBuffer = fs.readFileSync(SMALL_CSV_PATH);
            const smallCsvDataContent = Buffer.from(smallCsvDataBuffer).toString('utf-8');
            should(downloadedFile.text).eql(smallCsvDataContent);
        });
    });

    describe('get file metadata', () => {
        it('get not existing file metadata', async () => {
            const response = await requestCreator.getFileMetadata('10bc7982-d57b-4917-a952-7a8d8d75bf92');
            should(response.statusCode).eql(404);
        });

        it('get exiting file metadata', async () => {
            const response = await requestCreator.uploadFile('csv', SMALL_CSV_PATH);
            should(response.statusCode).eql(201);
            should(response.body.id).not.empty();

            const downloadedFile = await requestCreator.getFileMetadata(response.body.id);
            should(downloadedFile.statusCode).eql(200);
            should(downloadedFile.body).eql({ id: response.body.id, filename: 'small.csv' });
        });
    });
});
