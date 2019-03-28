'use strict';
let sinon = require('sinon');
let logger = require('../../../../src/common/logger');
let should = require('should');
let cassandraClient = require('../../../../src/tests/models/database/cassandra/cassandraConnector');
let uuid = require('uuid');
let uuidCassandraDriver = require('cassandra-driver').types.Uuid;

describe('Cassandra client tests', function() {
    let sandbox;
    let clientExecuteStub;
    let loggerErrorStub;

    before(() => {
        sandbox = sinon.sandbox.create();
        clientExecuteStub = sandbox.stub();
        cassandraClient.init({ execute: clientExecuteStub });
        loggerErrorStub = sandbox.stub(logger, 'error');
    });

    afterEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    describe('Insert new test tests', function(){
        it('should succeed simple insert', function(){
            clientExecuteStub.resolves({ result: { rowLength: 0 } });
            let id = uuid.v4();
            let revisionId = uuid.v4();

            let query = 'INSERT INTO tests(id, name, description, type, updated_at, raw_data, artillery_json, revision_id,file_id) values(?,?,?,?,?,?,?,?,?)';
            return cassandraClient.insertTest({ scenarios: { raw_data: 'raw' } }, { json: 'artillery' }, id, revisionId)
                .then(function(){
                    loggerErrorStub.callCount.should.eql(0);
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].should.eql(id);
                    clientExecuteStub.getCall(0).args[1][7].should.eql(revisionId);
                    clientExecuteStub.getCall(0).args[1][5].should.eql(JSON.stringify({ 'scenarios': { 'raw_data': 'raw' } }));
                    clientExecuteStub.getCall(0).args[1][6].should.eql(JSON.stringify({ json: 'artillery' }));
                });
        });

        it('should log error for failing inserting new test', function(){
            clientExecuteStub.rejects();
            return cassandraClient.insertTest({ data: 'raw' }, { json: 'artillery' }, uuid.v4(), uuid.v4())
                .catch(function(){
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });

    describe('Get single test', function(){
        it('Should get single test', function(){
            let query = 'SELECT * FROM tests WHERE id = ? ORDER BY updated_at DESC limit 1';
            let date = new Date();
            let cassandraResponse = {
                rows: [
                    { id: 'c1656c48-e028-11e7-80c1-9a214cf093aa', updated_at: date, raw_data: '{"data":"raw"}', artillery_json: '{"json":"artillery"}', revision_id: 'c1656c48-e028-11e7-80c1-9a214cf093ab' }
                ]
            };
            clientExecuteStub.resolves(cassandraResponse);
            return cassandraClient.getTest('c1656c48-e028-11e7-80c1-9a214cf093aa')
                .then(function(res) {
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    should(clientExecuteStub.getCall(0).args[1]).eql([uuidCassandraDriver.fromString('c1656c48-e028-11e7-80c1-9a214cf093aa')]);
                    should(JSON.stringify(res)).eql(JSON.stringify(cassandraResponse.rows[0]));
                });
        });

        it('Should get error because of cassandra error', function(){
            let query = 'SELECT * FROM tests WHERE id = ? ORDER BY updated_at DESC limit 1';
            clientExecuteStub.rejects();
            return cassandraClient.getTest('c1656c48-e028-11e7-80c1-9a214cf093aa')
                .then(function() {
                    throw new Error('Should not get here');
                }).catch(function() {
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].toString().should.eql('c1656c48-e028-11e7-80c1-9a214cf093aa');
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });

    describe('Delete test', function(){
        it('Should delete single test successfully', () => {
            let query = 'DELETE FROM tests WHERE id=?';
            let cassandraResponse = {};
            clientExecuteStub.resolves(cassandraResponse);
            return cassandraClient.deleteTest('c1656c48-e028-11e7-80c1-9a214cf093aa')
                .then(function(res) {
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1].should.eql(['c1656c48-e028-11e7-80c1-9a214cf093aa']);
                    res.should.eql(cassandraResponse);
                });
        });

        it('Should get error because of cassandra error', function(){
            let query = 'DELETE FROM tests WHERE id=?';
            clientExecuteStub.rejects();
            return cassandraClient.deleteTest('c1656c48-e028-11e7-80c1-9a214cf093aa')
                .then(function() {
                    throw new Error('Should not get here');
                }).catch(function() {
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].toString().should.eql('c1656c48-e028-11e7-80c1-9a214cf093aa');
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });

    describe('Get all test revisions', function(){
        it('Should get test revisions', function(){
            let query = 'SELECT * FROM tests WHERE id = ?';
            let date = new Date();
            let laterDate = new Date();
            let cassandraResponse = {
                rows: [
                    { id: 'c1656c48-e028-11e7-80c1-9a214cf093aa', updated_at: date, raw_data: '{"data":"raw"}', artillery_json: '{"json":"artillery"}', revision_id: 'c1656c48-e028-11e7-80c1-9a214cf093ab' },
                    { id: 'c1656c48-e028-11e7-80c1-9a214cf093aa', updated_at: laterDate, raw_data: '{"data":"raw"}', artillery_json: '{"json":"artillery"}', revision_id: 'c1656c48-e028-11e7-80c1-9a214cf093ac' }
                ]
            };
            clientExecuteStub.resolves(cassandraResponse);
            return cassandraClient.getAllTestRevisions('c1656c48-e028-11e7-80c1-9a214cf093aa')
                .then(function(res) {
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].toString().should.eql('c1656c48-e028-11e7-80c1-9a214cf093aa');
                    res.should.eql(cassandraResponse.rows);
                }).catch(function(err) {
                    throw new Error('Should not get here: ' + err);
                });
        });

        it('Should get error because of cassandra error', function(){
            let query = 'SELECT * FROM tests WHERE id = ?';
            clientExecuteStub.rejects();
            return cassandraClient.getAllTestRevisions('c1656c48-e028-11e7-80c1-9a214cf093aa')
                .then(function() {
                    throw new Error('Should not get here');
                }).catch(function() {
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    clientExecuteStub.getCall(0).args[1][0].toString().should.eql('c1656c48-e028-11e7-80c1-9a214cf093aa');
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });

    describe('Get all tests', function(){
        it('Should get all tests', function(){
            let query = 'SELECT * FROM tests';
            let date = new Date();
            let laterDate = new Date();
            let cassandraResponse = {
                rows: [
                    { id: 'c1656c48-e028-11e7-80c1-9a214cf093aa', updated_at: date, raw_data: '{"name":"Test1","description":"Test1"}', artillery_json: '{"json":"artillery"}', revision_id: 'c1656c48-e028-11e7-80c1-9a214cf093ab' },
                    { id: 'c1656c48-e028-11e7-80c1-9a214cf093ab', updated_at: laterDate, raw_data: '{"name":"Test2","description":"Test2"}', artillery_json: '{"json":"artillery"}', revision_id: 'c1656c48-e028-11e7-80c1-9a214cf093ac' }
                ]
            };

            clientExecuteStub.resolves(cassandraResponse);
            return cassandraClient.getTests()
                .then(function(res) {
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    res.should.eql(cassandraResponse.rows);
                }).catch(function(err) {
                    throw new Error('Should not get here: ' + err);
                });
        });

        it('Should get error because of cassandra error', function(){
            let query = 'SELECT * FROM tests';
            clientExecuteStub.rejects();
            return cassandraClient.getTests()
                .then(function() {
                    throw new Error('Should not get here');
                }).catch(function() {
                    clientExecuteStub.getCall(0).args[0].should.eql(query);
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });
    describe('Get dsl definition', function(){
        it('Should get definition object', function(){
            const cassandraResponse = {
                rows: [
                    { artillery_json: '{"json":"artillery"}' }
                ]
            };
            clientExecuteStub.resolves(cassandraResponse);
            return cassandraClient.getDslDefinition('dslName', 'definitionName')
                .then(function(res) {
                    should(clientExecuteStub.args).eql([
                        [
                            'SELECT * FROM dsl WHERE dsl_name = ? AND definition_name = ? limit 1',
                            [
                                'dslName',
                                'definitionName'
                            ],
                            {
                                'consistency': 6,
                                'prepare': true
                            }
                        ]
                    ]);
                    should(res).eql({
                        'artillery_json': {
                            'json': 'artillery'
                        }
                    });
                });
        });
        it('Should get definition undefined when there is no result', function(){
            const cassandraResponse = {
                rows: []
            };
            clientExecuteStub.resolves(cassandraResponse);
            return cassandraClient.getDslDefinition('dslName', 'definitionName')
                .then(function(res) {
                    should(clientExecuteStub.args).eql([
                        [
                            'SELECT * FROM dsl WHERE dsl_name = ? AND definition_name = ? limit 1',
                            [
                                'dslName',
                                'definitionName'
                            ],
                            {
                                'consistency': 6,
                                'prepare': true
                            }
                        ]
                    ]);
                    should(res).eql(undefined);
                });
        });

        it('Should get error because of cassandra error', function(){
            clientExecuteStub.rejects();
            return cassandraClient.getDslDefinition('dslName', 'definitionName')
                .then(function() {
                    throw new Error('Should not get here');
                }).catch(function() {
                    clientExecuteStub.getCall(0).args[0].should.eql('SELECT * FROM dsl WHERE dsl_name = ? AND definition_name = ? limit 1');
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });
    describe('Get dsl definitions', function(){
        it('Should get array of definition object', function(){
            const cassandraResponse = {
                rows: [
                    { artillery_json: '{"json":"artillery"}' },
                    { artillery_json: '{"json":"artillery2"}' }
                ]
            };
            clientExecuteStub.resolves(cassandraResponse);
            return cassandraClient.getDslDefinitions('dslName')
                .then(function(res) {
                    should(clientExecuteStub.args).eql([
                        [
                            'SELECT * FROM dsl WHERE dsl_name = ?',
                            [
                                'dslName'
                            ],
                            {
                                'consistency': 6,
                                'prepare': true
                            }
                        ]
                    ]);
                    should(res).eql([
                        {
                            'artillery_json': {
                                'json': 'artillery'
                            }
                        },
                        {
                            'artillery_json': {
                                'json': 'artillery2'
                            }
                        }
                    ]);
                });
        });
        it('Should get empty array when there is no result', function(){
            const cassandraResponse = {
                rows: []
            };
            clientExecuteStub.resolves(cassandraResponse);
            return cassandraClient.getDslDefinitions('dslName')
                .then(function(res) {
                    should(clientExecuteStub.args).eql([
                        [
                            'SELECT * FROM dsl WHERE dsl_name = ?',
                            [
                                'dslName'
                            ],
                            {
                                'consistency': 6,
                                'prepare': true
                            }
                        ]
                    ]);
                    should(res).eql([]);
                });
        });

        it('Should get error because of cassandra error', function(){
            clientExecuteStub.rejects();
            return cassandraClient.getDslDefinitions('dslName')
                .then(function() {
                    throw new Error('Should not get here');
                }).catch(function() {
                    clientExecuteStub.getCall(0).args[0].should.eql('SELECT * FROM dsl WHERE dsl_name = ?');
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });
    describe('update dsl definition', function(){
        it('Should get true when update applied', function(){
            const cassandraResponse = {
                rows: [
                    { '[applied]': true }
                ]
            };
            clientExecuteStub.resolves(cassandraResponse);
            return cassandraClient.updateDslDefinition('dslName', 'definitionName', { json: 'artillery' })
                .then(function(res) {
                    should(clientExecuteStub.args).eql([
                        [
                            'UPDATE dsl SET artillery_json= ? WHERE dsl_name = ? AND definition_name = ? IF EXISTS;',
                            [
                                '{"json":"artillery"}',
                                'dslName',
                                'definitionName'
                            ],
                            {
                                'consistency': 6,
                                'prepare': true
                            }
                        ]
                    ]);
                    should(res).eql(true);
                });
        });
        it('Should get false when update does not applied', function(){
            const cassandraResponse = {
                rows: [
                    { '[applied]': false }
                ]
            };
            clientExecuteStub.resolves(cassandraResponse);
            return cassandraClient.updateDslDefinition('dslName', 'definitionName', { json: 'artillery' })
                .then(function(res) {
                    should(clientExecuteStub.args).eql([
                        [
                            'UPDATE dsl SET artillery_json= ? WHERE dsl_name = ? AND definition_name = ? IF EXISTS;',
                            [
                                '{"json":"artillery"}',
                                'dslName',
                                'definitionName'
                            ],
                            {
                                'consistency': 6,
                                'prepare': true
                            }
                        ]
                    ]);
                    should(res).eql(false);
                });
        });

        it('Should get error because of cassandra error', function(){
            clientExecuteStub.rejects();
            return cassandraClient.updateDslDefinition('dslName', 'definitionName', { json: 'artillery' })
                .then(function() {
                    throw new Error('Should not get here');
                }).catch(function() {
                    clientExecuteStub.getCall(0).args[0].should.eql('UPDATE dsl SET artillery_json= ? WHERE dsl_name = ? AND definition_name = ? IF EXISTS;');
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });
    describe('delete dsl definition', function(){
        it('Should get true when delete applied', function(){
            const cassandraResponse = {
                rows: [
                    { '[applied]': true }
                ]
            };
            clientExecuteStub.resolves(cassandraResponse);
            return cassandraClient.deleteDefinition('dslName', 'definitionName')
                .then(function(res) {
                    should(clientExecuteStub.args).eql([
                        [
                            'DELETE FROM dsl WHERE dsl_name = ? AND definition_name = ? IF EXISTS;',
                            [
                                'dslName',
                                'definitionName'
                            ],
                            {
                                'consistency': 6,
                                'prepare': true
                            }
                        ]
                    ]);
                    should(res).eql(true);
                });
        });
        it('Should get false when delete does not applied', function(){
            const cassandraResponse = {
                rows: [
                    { '[applied]': false }
                ]
            };
            clientExecuteStub.resolves(cassandraResponse);
            return cassandraClient.deleteDefinition('dslName', 'definitionName')
                .then(function(res) {
                    should(clientExecuteStub.args).eql([
                        [
                            'DELETE FROM dsl WHERE dsl_name = ? AND definition_name = ? IF EXISTS;',
                            [
                                'dslName',
                                'definitionName'
                            ],
                            {
                                'consistency': 6,
                                'prepare': true
                            }
                        ]
                    ]);
                    should(res).eql(false);
                });
        });

        it('Should get error because of cassandra error', function(){
            clientExecuteStub.rejects();
            return cassandraClient.deleteDefinition('dslName', 'definitionName')
                .then(function() {
                    throw new Error('Should not get here');
                }).catch(function() {
                    clientExecuteStub.getCall(0).args[0].should.eql('DELETE FROM dsl WHERE dsl_name = ? AND definition_name = ? IF EXISTS;');
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });
    describe('insertDslDefinition definition', function(){
        it('Should get true when insert applied', function(){
            const cassandraResponse = {
                rows: [
                    { '[applied]': true }
                ]
            };
            clientExecuteStub.resolves(cassandraResponse);
            return cassandraClient.insertDslDefinition('dslName', 'definitionName', { data: 'data' })
                .then(function(res) {
                    should(clientExecuteStub.args).eql([
                        [
                            'INSERT INTO dsl(dsl_name, definition_name, artillery_json) values(?,?,?) IF NOT EXISTS',
                            [
                                'dslName',
                                'definitionName',
                                '{"data":"data"}'
                            ],
                            {
                                'consistency': 6,
                                'prepare': true
                            }
                        ]
                    ]);
                    should(res).eql(true);
                });
        });
        it('Should get false when insert applied does not applied', function(){
            const cassandraResponse = {
                rows: [
                    { '[applied]': false }
                ]
            };
            clientExecuteStub.resolves(cassandraResponse);
            return cassandraClient.insertDslDefinition('dslName', 'definitionName', { data: 'data' })
                .then(function(res) {
                    should(clientExecuteStub.args).eql([
                        [
                            'INSERT INTO dsl(dsl_name, definition_name, artillery_json) values(?,?,?) IF NOT EXISTS',
                            [
                                'dslName',
                                'definitionName',
                                '{"data":"data"}'
                            ],
                            {
                                'consistency': 6,
                                'prepare': true
                            }
                        ]
                    ]);
                    should(res).eql(false);
                });
        });

        it('Should get error because of cassandra error', function(){
            clientExecuteStub.rejects();
            return cassandraClient.insertDslDefinition('dslName', 'definitionName', { data: 'data' })
                .then(function() {
                    throw new Error('Should not get here');
                }).catch(function() {
                    clientExecuteStub.getCall(0).args[0].should.eql('INSERT INTO dsl(dsl_name, definition_name, artillery_json) values(?,?,?) IF NOT EXISTS');
                    loggerErrorStub.callCount.should.eql(1);
                });
        });
    });
});