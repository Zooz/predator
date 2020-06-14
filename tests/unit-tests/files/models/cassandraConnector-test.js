'use strict';
let sinon = require('sinon');
let logger = require('../../../../src/common/logger');
let should = require('should');
let cassandraClient = require('../../../../src/files/models/database/cassandra/cassandraConnector');
let uuid = require('uuid');

describe('Cassandra client tests', function () {
    let sandbox;
    let clientExecuteStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        clientExecuteStub = sandbox.stub();
        cassandraClient.init({ execute: clientExecuteStub });
    });

    afterEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    describe('Create and get files', function () {
        it('should succeed simple insert of file', async () => {
            clientExecuteStub.resolves({ result: { rowLength: 0 } });
            let id = uuid.v4();

            let query = 'INSERT INTO files(id,name,file) values(?,?,?)';
            await cassandraClient.saveFile(id, 'some_file.txt', 'contentcontentcontent');
            clientExecuteStub.getCall(0).args[0].should.eql(query);
            clientExecuteStub.getCall(0).args[1][0].should.eql(id);
            clientExecuteStub.getCall(0).args[1][1].should.eql('some_file.txt');
            clientExecuteStub.getCall(0).args[1][2].should.eql('contentcontentcontent');
        });
        it('should succeed simple get of file', async () => {
            clientExecuteStub.resolves({ rows: [ { name: 'file.txt', file: 'abcdef' }] });
            let id = uuid.v4();

            let query = 'SELECT id, name FROM files WHERE id = ?';
            let file = await cassandraClient.getFile(id);

            clientExecuteStub.getCall(0).args[0].should.eql(query);
            clientExecuteStub.getCall(0).args[1][0].should.eql(id);

            file.name.should.eql('file.txt');
            file.file.should.eql('abcdef');
        });

        it('should succeed simple get of file with content', async () => {
            clientExecuteStub.resolves({ rows: [ { name: 'file.txt', file: 'abcdef' }] });
            let id = uuid.v4();

            let query = 'SELECT * FROM files WHERE id = ?';
            let file = await cassandraClient.getFile(id, true);

            clientExecuteStub.getCall(0).args[0].should.eql(query);
            clientExecuteStub.getCall(0).args[1][0].should.eql(id);

            file.name.should.eql('file.txt');
            file.file.should.eql('abcdef');
        });

        it('should return undefined when file not found', async () => {
            clientExecuteStub.resolves({ rows: [] });
            let id = uuid.v4();

            let query = 'SELECT id, name FROM files WHERE id = ?';
            let file = await cassandraClient.getFile(id);

            clientExecuteStub.getCall(0).args[0].should.eql(query);
            clientExecuteStub.getCall(0).args[1][0].should.eql(id);

            should(file).eql(undefined);
        });
    });
});
