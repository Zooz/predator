'use strict';
let should = require('should');
let fileManager = require('../../../../src/files/models/fileManager');
let sinon = require('sinon');
let database = require('../../../../src/files/models/database');
const UUID_PATTERN = /^[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}$/i;
describe('Scenario generator tests', function () {
    let sandbox;
    let saveFileStub;
    let getFileStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        getFileStub = sandbox.stub(database, 'getFile');
        saveFileStub = sandbox.stub(database, 'saveFile');
    });

    beforeEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });
    describe('Create new file', function () {
        it('Should save new file to database', async () => {
            saveFileStub.resolves();
            let id = await fileManager.saveFile('mickey.csv', 'mickey the predator');
            saveFileStub.calledOnce.should.eql(true);
            should(saveFileStub.getCall(0).args[0]).match(UUID_PATTERN);
            should(saveFileStub.getCall(0).args[1]).eql('mickey.csv');
            should(saveFileStub.getCall(0).args[2]).eql(Buffer.from('mickey the predator').toString('base64'));
            should(id).match(UUID_PATTERN);
        });
        it('Should fail to download file throw error', async () => {
            saveFileStub.throws(new Error('error saving file'));
            try {
                await fileManager.saveFile('mickey.csv', 'mickey the predator');
                should.fail('Expected error to throw');
            } catch (err) {
                should(err.message).eql('error saving file');
            }
        });
    });
    describe('get a file', function () {
        it('Should get file from database', async () => {
            getFileStub.resolves({ id: 'someId', name: 'mickey.csv', file: 'mickey the predator' });

            let file = await fileManager.getFile('someId');
            getFileStub.calledOnce.should.eql(true);
            should(getFileStub.getCall(0).args[0]).eql('someId');
            should(file).eql({
                id: 'someId',
                filename: 'mickey.csv',
                content: 'mickey the predator'
            });
        });
        it('Should  throw 404 not found', async () => {
            getFileStub.resolves(undefined);
            try {
                await fileManager.getFile('idNotExist');
                throw new Error('never should arrived here');
            } catch (error) {
                should(error.statusCode).eql(404);
                should(error.message).eql('Not found');
            }
        });
    });
});
