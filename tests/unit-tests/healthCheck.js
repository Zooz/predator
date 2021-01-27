const { expect } = require('chai'),
    sinon = require('sinon');

const healthController = require('../../src/common/controllers/healthController');
const database = require('../../src/database/database');
const streamingManager = require('../../src/streaming/manager');

describe('health check', function() {
    let sandbox;
    let req, res;
    let dbHealthStub, streamingManagerHealthStub, jsonStub, statusStub;
    before(function() {
        sandbox = sinon.createSandbox();
        dbHealthStub = sandbox.stub(database, 'ping');
        streamingManagerHealthStub = sandbox.stub(streamingManager, 'health');
        statusStub = sandbox.stub().returnsThis();
        jsonStub = sandbox.stub();
    });
    beforeEach(function() {
        req = { };
        res = {
            status: statusStub,
            json: jsonStub
        };
    });
    afterEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    describe('return 200 - UP', function() {
        it('db and streaming manager are up - return 200', async function() {
            dbHealthStub.resolves();
            streamingManagerHealthStub.resolves();
            await healthController.check(req, res);
            expect(res.status.args[0][0]).eql(200);
            expect(res.json.args[0][0]).eql({ status: 'OK' });
        });
        it('db is up and streaming manager is down - return 200 with streaming_platform error', async function() {
            dbHealthStub.resolves();
            streamingManagerHealthStub.rejects(new Error('failed to connect to kafka'));
            await healthController.check(req, res);
            expect(res.status.args[0][0]).eql(200);
            expect(res.json.args[0][0]).eql(
                {
                    errors: {
                        streaming_platform: 'failed to connect to kafka'
                    },
                    status: 'OK'
                }
            );
        });
    });
    describe('return 503 - DOWN', function() {
        it('db is down streaming manager is up - return 503', async function() {
            dbHealthStub.rejects(new Error('db down'));
            streamingManagerHealthStub.resolves();
            await healthController.check(req, res);
            expect(res.status.args[0][0]).eql(503);
            expect(res.json.args[0][0]).eql({
                errors: {
                    database: 'db down'
                },
                status: 'DOWN'
            });
        });
        it('db is down and streaming manager is down - return 503', async function() {
            dbHealthStub.rejects(new Error('db down'));
            streamingManagerHealthStub.rejects(new Error('failed to connect to kafka'));
            await healthController.check(req, res);
            expect(res.status.args[0][0]).eql(503);
            expect(res.json.args[0][0]).eql({
                errors: {
                    database: 'db down',
                    streaming_platform: 'failed to connect to kafka'
                },
                status: 'DOWN'
            });
        });
    });
});