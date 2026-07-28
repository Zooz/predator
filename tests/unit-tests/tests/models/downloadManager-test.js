'use strict';
const should = require('should');
const sinon = require('sinon');
const downloadManager = require('../../../../src/tests/models/downloadManager');

describe('Download manager tests', function () {
    let sandbox, fetchStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        fetchStub = sandbox.stub(global, 'fetch');
    });

    afterEach(() => sandbox.restore());

    it('returns the file body', async () => {
        fetchStub.resolves({ ok: true, text: async () => 'processor js' });

        const file = await downloadManager.downloadFile('http://dropbox/file.js');

        should(file).eql('processor js');
        should(fetchStub.args[0][0]).eql('http://dropbox/file.js');
    });

    it('wraps a non-2xx response as a 422', async () => {
        fetchStub.resolves({ ok: false, status: 404, statusText: 'Not Found' });

        try {
            await downloadManager.downloadFile('http://dropbox/missing.js');
            should.fail('Expected error to throw');
        } catch (error) {
            should(error.statusCode).eql(422);
            should(error.message).startWith('Error to download file');
        }
    });

    it('wraps a transport failure as a 422', async () => {
        fetchStub.rejects(new Error('connection refused'));

        try {
            await downloadManager.downloadFile('http://dropbox/file.js');
            should.fail('Expected error to throw');
        } catch (error) {
            should(error.statusCode).eql(422);
        }
    });
});
