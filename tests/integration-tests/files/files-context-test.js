'use strict';

const requestCreator = require('./helpers/requestCreator');
const should = require('should');
const path = require('path');

const SMALL_CSV_PATH = path.join(__dirname, 'helpers', 'small.csv');

describe('files api with contexts', () => {
    let headers;
    before(async () => {
        headers = { 'x-context-id': 'mickey' };
        process.env.MAX_UPLOAD_FILE_SIZE_MB = 0.5;
        await requestCreator.init();
    });

    after(() => {
        delete process.env.MAX_UPLOAD_FILE_SIZE_MB;
    });

    describe('upload and download file', () => {
        it('with same ontext_id', async () => {
            const response = await requestCreator.uploadFile('csv', SMALL_CSV_PATH, headers);
            should(response.statusCode).eql(201);
            should(response.body.id).not.empty();
            should(response.body.filename).eql('small.csv');

            const downloadedFile = await requestCreator.downloadFile(response.body.id, headers);
            should(downloadedFile.statusCode).eql(200);
        });

        it('with different context_ids - download file should return 404', async () => {
            const response = await requestCreator.uploadFile('csv', SMALL_CSV_PATH, headers);
            should(response.statusCode).eql(201);
            should(response.body.id).not.empty();
            should(response.body.filename).eql('small.csv');

            const downloadedFile = await requestCreator.downloadFile(response.body.id, { 'x-context-id': 'random' });
            should(downloadedFile.statusCode).eql(404);
        });
    });

    describe('get file metadata', () => {
        it('get exiting file metadata with context_id', async () => {
            const response = await requestCreator.uploadFile('csv', SMALL_CSV_PATH, headers);
            should(response.statusCode).eql(201);
            should(response.body.id).not.empty();

            const fileMetadata = await requestCreator.getFileMetadata(response.body.id, headers);
            should(fileMetadata.statusCode).eql(200);
            should(fileMetadata.body).eql({ id: response.body.id, filename: 'small.csv' });
        });

        it('get exiting file metadata with wrong context_id - return 404', async () => {
            const response = await requestCreator.uploadFile('csv', SMALL_CSV_PATH, headers);
            should(response.statusCode).eql(201);
            should(response.body.id).not.empty();

            const fileMetadata = await requestCreator.getFileMetadata(response.body.id, { 'x-context-id': 'random' });
            should(fileMetadata.statusCode).eql(404);
        });
    });
});
