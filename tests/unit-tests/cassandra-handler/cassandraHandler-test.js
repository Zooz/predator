// 'use strict';
//
// let sinon = require('sinon');
// let rewire = require('rewire');
// let chai = require('chai');
// let expect = chai.expect;
// let chaiSinon = require('chai-sinon');
// chai.use(chaiSinon);
// let logger = require('../../../src/helpers/logger');
// let cassandra = require('cassandra-driver');
// let cassandraConfig = require('../../../src/config/databaseConfig');
// let cassandraHandler = rewire('../../../src/cassandra-handler/cassandraHandler');
//
// describe('cassandra handler tests', function () {
//     let sandbox;
//     cassandraConfig.address = 'localhost:9042';
//     cassandraConfig.username = 'username';
//     cassandraConfig.password = 'password';
//     cassandraConfig.name = 'predator';
//
//     before(function () {
//         sandbox = sinon.sandbox.create();
//     });
//
//     afterEach(function () {
//         sandbox.restore();
//     });
//
//     describe('cassandra ping tests', function () {
//         let clientExecuteStub;
//
//         beforeEach(function () {
//             sandbox.reset();
//             let client = {
//                 execute: sinon.stub()
//             };
//
//             let stubClient = sandbox.stub(cassandra, 'Client');
//             stubClient.returns(client);
//             clientExecuteStub = client.execute;
//         });
//
//         it('ping is ok, cassandra is up', function (done) {
//             clientExecuteStub.resolves({rows: [{}]});
//
//             cassandraHandler.initArgs();
//             cassandraHandler.initCassandraConnection()
//                 .then(function () {
//                     return cassandraHandler.ping('keyspace');
//                 }).then(function (result) {
//                     expect(result).to.be.true;
//                     done();
//                 }).catch(function (error) {
//                     done(error);
//                 });
//         });
//
//         it('ping rejects as no schema, cassandra is down', function (done) {
//             clientExecuteStub.resolves({rows: []});
//
//             cassandraHandler.initArgs();
//             cassandraHandler.initCassandraConnection()
//                 .then(function () {
//                     return cassandraHandler.ping('keyspace');
//                 }).then(function () {
//                     done('Expecting test to fail');
//                 }).catch(function (error) {
//                     expect(error.message).to.eql('Key space doesn\'t found');
//                     done();
//                 });
//         });
//
//         it('cassandra rejects with error, cassandra is down', function (done) {
//             clientExecuteStub.rejects({message: 'failure'});
//
//             cassandraHandler.initArgs();
//             cassandraHandler.initCassandraConnection()
//                 .then(function () {
//                     return cassandraHandler.ping('keyspace');
//                 }).then(function () {
//                     done('Expecting test to fail');
//                 }).catch(function (error) {
//                     expect(error.message).to.eql('failure');
//                     done();
//                 });
//         });
//     });
//
//     describe('initializeCassandraEnvironment tests', function () {
//         beforeEach(function () {
//             cassandraConfig.address = 'localhost:9042';
//             cassandraConfig.username = 'cassandra';
//             cassandraConfig.password = 'cassandra';
//             let cassandraHandlerLogContext = {
//                 'x-zooz-request-id': 'service-startup',
//                 'key_space_name': cassandraConfig.name,
//                 'init_file_name_template': 'cassandra_config_template.json',
//                 'init_file_name': 'cassandra_config.json'
//             };
//             cassandraHandler.__set__('cassandraHandlerLogContext', cassandraHandlerLogContext);
//         });
//
//         afterEach(function () {
//             sandbox.restore();
//         });
//
//         describe('createKeySpaceIfNeeded rejects', function () {
//             it('Should exit the process and log the error', function (done) {
//                 let stubAuthProvider = sandbox.stub(cassandra.auth, 'PlainTextAuthProvider');
//                 stubAuthProvider.returns({
//                     'test': 'test'
//                 });
//
//                 let client = {
//                     execute: sinon.stub(),
//                     shutdown: sinon.stub()
//                 };
//
//                 let clientExecuteStub = client.execute;
//                 let error = {
//                     innerErrors: 'client execute error'
//                 };
//                 clientExecuteStub.yields(error);
//
//                 let clientShutdownStub = client.shutdown;
//                 clientShutdownStub.yields(undefined);
//
//                 let stubClient = sandbox.stub(cassandra, 'Client');
//                 stubClient.returns(client);
//
//                 let fs = {
//                     writeFile: sinon.stub(),
//                     remove: sinon.stub()
//                 };
//
//                 let fsStub = fs.writeFile;
//                 cassandraHandler.__set__('fs', fs);
//                 fsStub.yields(null);
//
//                 let fsRemoveStub = fs.remove;
//                 fsRemoveStub.yields(null);
//
//                 let cmd = {
//                     get: sinon.stub()
//                 };
//
//                 let cmdStub = cmd.get;
//                 cassandraHandler.__set__('cmd', cmd);
//                 cmdStub.yields(null, null, null);
//
//                 let stubErrorLogger = sinon.stub(logger, 'error');
//
//                 let processStub = {
//                     exit: sinon.stub()
//                 };
//
//                 let exitStub = processStub.exit;
//                 exitStub.resolves();
//                 cassandraHandler.__set__('process', processStub);
//
//                 let initializeCassandraEnvironmentError = {
//                     'x-zooz-request-id': 'service-startup',
//                     'key_space_name': 'predator',
//                     'init_file_name_template': 'cassandra_config_template.json',
//                     'init_file_name': 'cassandra_config.json',
//                     'create_key_space_query_err': {
//                         'innerErrors': 'client execute error'
//                     },
//                     'create_key_space_query_inner_err': 'client execute error',
//                     'initialize_cassandra_environment_error': {
//                         'innerErrors': 'client execute error'
//                     }
//                 };
//
//                 cassandraHandler.initializeCassandraEnvironment().then(function () {
//                     expect(stubAuthProvider.calledWith('cassandra', 'cassandra')).equal(true);
//                     expect(stubAuthProvider).to.have.been.calledOnce;
//                     expect(stubClient).to.have.been.calledOnce;
//                     expect(fsStub).to.have.not.been.calledOnce;
//                     expect(fsRemoveStub).to.have.not.been.calledOnce;
//                     expect(cmdStub).to.have.not.been.calledOnce;
//                     expect(clientExecuteStub).to.have.been.calledOnce;
//                     expect(clientShutdownStub).to.have.not.been.calledOnce;
//                     expect(stubErrorLogger.calledWith(initializeCassandraEnvironmentError, 'Cassandra handler: could not create keyspace')).to.be.true;
//                     expect(stubErrorLogger.calledWith(initializeCassandraEnvironmentError, 'Cassandra handler: error occurred while trying to init cassandra credentials')).to.be.true;
//                     expect(exitStub).to.have.been.calledOnce;
//                     stubErrorLogger.restore();
//                     done();
//                 }).catch(function (error) {
//                     done(error);
//                 });
//             });
//         });
//         describe('closeCassandraConnection rejects', function () {
//             it('Should exit the process and log the error', function (done) {
//                 let stubAuthProvider = sandbox.stub(cassandra.auth, 'PlainTextAuthProvider');
//                 stubAuthProvider.returns({
//                     'test': 'test'
//                 });
//
//                 let client = {
//                     execute: sinon.stub(),
//                     shutdown: sinon.stub()
//                 };
//
//                 let clientExecuteStub = client.execute;
//                 let error = {
//                     innerErrors: 'client execute error'
//                 };
//                 clientExecuteStub.yields(undefined);
//
//                 let clientShutdownStub = client.shutdown;
//                 clientShutdownStub.yields(error);
//
//                 let stubClient = sandbox.stub(cassandra, 'Client');
//                 stubClient.returns(client);
//
//                 let fs = {
//                     writeFile: sinon.stub(),
//                     remove: sinon.stub()
//                 };
//
//                 let fsStub = fs.writeFile;
//                 cassandraHandler.__set__('fs', fs);
//                 fsStub.yields(null);
//
//                 let fsRemoveStub = fs.remove;
//                 fsRemoveStub.yields(null);
//
//                 let cmd = {
//                     get: sinon.stub()
//                 };
//
//                 let cmdStub = cmd.get;
//                 cassandraHandler.__set__('cmd', cmd);
//                 cmdStub.yields(null, null, null);
//
//                 let stubErrorLogger = sinon.stub(logger, 'error');
//
//                 let processStub = {
//                     exit: sinon.stub()
//                 };
//
//                 let exitStub = processStub.exit;
//                 exitStub.resolves();
//                 cassandraHandler.__set__('process', processStub);
//                 let initializeCassandraEnvironmentError = {
//                     'x-zooz-request-id': 'service-startup',
//                     'key_space_name': 'predator',
//                     'init_file_name_template': 'cassandra_config_template.json',
//                     'init_file_name': 'cassandra_config.json',
//                     'client_shutdown_err': {
//                         'innerErrors': 'client execute error'
//                     },
//                     'initialize_cassandra_environment_error': {
//                         'innerErrors': 'client execute error'
//                     }
//                 };
//
//                 cassandraHandler.initializeCassandraEnvironment().then(function () {
//                     expect(stubAuthProvider.calledWith('cassandra', 'cassandra')).equal(true);
//                     expect(stubAuthProvider).to.have.been.calledOnce;
//                     expect(stubClient).to.have.been.calledOnce;
//                     expect(fsStub).to.have.not.been.calledOnce;
//                     expect(fsRemoveStub).to.have.not.been.calledOnce;
//                     expect(cmdStub).to.have.not.been.calledOnce;
//                     expect(clientExecuteStub).to.have.been.calledOnce;
//                     expect(clientShutdownStub).to.have.been.calledOnce;
//                     expect(stubErrorLogger.calledWith(initializeCassandraEnvironmentError, 'Cassandra handler: failed to close Cassandra connection.')).to.be.true;
//                     expect(exitStub).to.have.been.calledOnce;
//                     stubErrorLogger.restore();
//                     done();
//                 });
//             });
//         });
//         describe('createConfigTemplateFile rejects', function () {
//             it('Should exit the process and log the error', function (done) {
//                 let stubAuthProvider = sandbox.stub(cassandra.auth, 'PlainTextAuthProvider');
//                 stubAuthProvider.returns({
//                     'test': 'test'
//                 });
//
//                 let client = {
//                     execute: sinon.stub(),
//                     shutdown: sinon.stub()
//                 };
//
//                 let clientExecuteStub = client.execute;
//                 let error = 'error_message';
//                 clientExecuteStub.yields(undefined);
//
//                 let clientShutdownStub = client.shutdown;
//                 clientShutdownStub.yields(undefined);
//
//                 let stubClient = sandbox.stub(cassandra, 'Client');
//                 stubClient.returns(client);
//
//                 let fs = {
//                     writeFile: sinon.stub(),
//                     remove: sinon.stub()
//                 };
//
//                 let fsStub = fs.writeFile;
//                 cassandraHandler.__set__('fs', fs);
//                 fsStub.yields(error);
//
//                 let fsRemoveStub = fs.remove;
//                 fsRemoveStub.yields(null);
//
//                 let cmd = {
//                     get: sinon.stub()
//                 };
//
//                 let cmdStub = cmd.get;
//                 cassandraHandler.__set__('cmd', cmd);
//                 cmdStub.yields(null, null, null);
//
//                 let stubErrorLogger = sinon.stub(logger, 'error');
//
//                 let processStub = {
//                     exit: sinon.stub()
//                 };
//
//                 let exitStub = processStub.exit;
//                 exitStub.resolves();
//                 cassandraHandler.__set__('process', processStub);
//
//                 let initializeCassandraEnvironmentError = {
//                     'x-zooz-request-id': 'service-startup',
//                     'key_space_name': 'predator',
//                     'init_file_name_template': 'cassandra_config_template.json',
//                     'init_file_name': 'cassandra_config.json',
//                     'remove_config_template_file_err': 'error_message',
//                     'initialize_cassandra_environment_error': 'error_message'
//                 };
//
//                 cassandraHandler.initializeCassandraEnvironment().then(function () {
//                     expect(stubAuthProvider.calledWith('cassandra', 'cassandra')).equal(true);
//                     expect(stubAuthProvider).to.have.been.calledOnce;
//                     expect(stubClient).to.have.been.calledOnce;
//                     expect(fsStub).to.have.been.calledOnce;
//                     expect(fsRemoveStub).to.have.not.been.calledOnce;
//                     expect(cmdStub).to.have.not.been.calledOnce;
//                     expect(clientExecuteStub).to.have.been.calledOnce;
//                     expect(clientShutdownStub).to.have.been.calledOnce;
//                     expect(stubErrorLogger.calledWith(initializeCassandraEnvironmentError, 'Cassandra handler: could not write to cassandra init file')).to.be.true;
//                     expect(exitStub).to.have.been.calledOnce;
//                     stubErrorLogger.restore();
//                     done();
//                 });
//             });
//         });
//         describe('runCassandraScripts rejects', function () {
//             it('Should exit the process and log the error', function (done) {
//                 let stubAuthProvider = sandbox.stub(cassandra.auth, 'PlainTextAuthProvider');
//                 stubAuthProvider.returns({
//                     'test': 'test'
//                 });
//
//                 let client = {
//                     execute: sinon.stub(),
//                     shutdown: sinon.stub()
//                 };
//
//                 let clientExecuteStub = client.execute;
//                 let error = 'error_message';
//                 clientExecuteStub.yields(undefined);
//
//                 let clientShutdownStub = client.shutdown;
//                 clientShutdownStub.yields(undefined);
//
//                 let stubClient = sandbox.stub(cassandra, 'Client');
//                 stubClient.returns(client);
//
//                 let fs = {
//                     writeFile: sinon.stub(),
//                     remove: sinon.stub()
//                 };
//
//                 let fsStub = fs.writeFile;
//                 cassandraHandler.__set__('fs', fs);
//                 fsStub.yields(undefined);
//
//                 let fsRemoveStub = fs.remove;
//                 fsRemoveStub.yields(null);
//
//                 let cmd = {
//                     get: sinon.stub()
//                 };
//
//                 let cmdStub = cmd.get;
//                 cassandraHandler.__set__('cmd', cmd);
//                 cmdStub.yields(error, null, null);
//
//                 let stubErrorLogger = sinon.stub(logger, 'error');
//
//                 let processStub = {
//                     exit: sinon.stub()
//                 };
//
//                 let exitStub = processStub.exit;
//                 exitStub.resolves();
//                 cassandraHandler.__set__('process', processStub);
//
//                 let initializeCassandraEnvironmentError = {
//                     'x-zooz-request-id': 'service-startup',
//                     'key_space_name': 'predator',
//                     'init_file_name_template': 'cassandra_config_template.json',
//                     'init_file_name': 'cassandra_config.json',
//                     'run_cassandra_scripts_err': 'error_message',
//                     'run_cassandra_scripts_stderr': null,
//                     'initialize_cassandra_environment_error': 'error_message'
//                 };
//
//                 cassandraHandler.initializeCassandraEnvironment().then(function () {
//                     expect(stubAuthProvider.calledWith('cassandra', 'cassandra')).equal(true);
//                     expect(stubAuthProvider).to.have.been.calledOnce;
//                     expect(stubClient).to.have.been.calledOnce;
//                     expect(fsStub).to.have.been.calledOnce;
//                     expect(fsRemoveStub).to.have.not.been.calledOnce;
//                     expect(cmdStub).to.have.been.calledOnce;
//                     expect(clientExecuteStub).to.have.been.calledOnce;
//                     expect(clientShutdownStub).to.have.been.calledOnce;
//                     expect(stubErrorLogger.calledWith(initializeCassandraEnvironmentError, 'Cassandra handler: failed running cassandra migration scripts')).to.be.true;
//                     expect(exitStub).to.have.been.calledOnce;
//                     stubErrorLogger.restore();
//                     done();
//                 });
//             });
//         });
//         describe('removeConfigFile rejects', function () {
//             it('Should exit the process and log the error', function (done) {
//                 let stubAuthProvider = sandbox.stub(cassandra.auth, 'PlainTextAuthProvider');
//                 stubAuthProvider.returns({
//                     'test': 'test'
//                 });
//
//                 let client = {
//                     execute: sinon.stub(),
//                     shutdown: sinon.stub()
//                 };
//
//                 let clientExecuteStub = client.execute;
//                 let error = 'error_message';
//                 clientExecuteStub.yields(undefined);
//
//                 let clientShutdownStub = client.shutdown;
//                 clientShutdownStub.yields(undefined);
//
//                 let stubClient = sandbox.stub(cassandra, 'Client');
//                 stubClient.returns(client);
//
//                 let fs = {
//                     writeFile: sinon.stub(),
//                     remove: sinon.stub()
//                 };
//
//                 let fsStub = fs.writeFile;
//                 cassandraHandler.__set__('fs', fs);
//                 fsStub.yields(undefined);
//
//                 let fsRemoveStub = fs.remove;
//                 fsRemoveStub.yields(error);
//
//                 let cmd = {
//                     get: sinon.stub()
//                 };
//
//                 let cmdStub = cmd.get;
//                 cassandraHandler.__set__('cmd', cmd);
//                 cmdStub.yields(null, null, null);
//
//                 let stubErrorLogger = sinon.stub(logger, 'error');
//
//                 let processStub = {
//                     exit: sinon.stub()
//                 };
//
//                 let exitStub = processStub.exit;
//                 exitStub.resolves();
//                 cassandraHandler.__set__('process', processStub);
//
//                 let initializeCassandraEnvironmentError = {
//                     'x-zooz-request-id': 'service-startup',
//                     'key_space_name': 'predator',
//                     'init_file_name_template': 'cassandra_config_template.json',
//                     'init_file_name': 'cassandra_config.json',
//                     'remove_config_file_err': 'error_message',
//                     'initialize_cassandra_environment_error': 'error_message'
//                 };
//
//                 cassandraHandler.initializeCassandraEnvironment().then(function () {
//                     expect(stubAuthProvider.calledWith('cassandra', 'cassandra')).equal(true);
//                     expect(stubAuthProvider).to.have.been.calledOnce;
//                     expect(stubClient).to.have.been.calledOnce;
//                     expect(fsStub).to.have.been.calledOnce;
//                     expect(fsRemoveStub).to.have.been.calledOnce;
//                     expect(cmdStub).to.have.been.calledOnce;
//                     expect(clientExecuteStub).to.have.been.calledOnce;
//                     expect(clientShutdownStub).to.have.been.calledOnce;
//                     expect(stubErrorLogger.calledWith(initializeCassandraEnvironmentError, 'Cassandra handler: could not remove cassandra migration config file')).to.be.true;
//                     expect(exitStub).to.have.been.calledOnce;
//                     stubErrorLogger.restore();
//                     done();
//                 });
//             });
//         });
//     });
// });
