const { expect } = require('chai'),
    rewire = require('rewire'),
    sinon = require('sinon');

const streamingManager = rewire('../../../src/streaming/manager'),
    kafkaManager = require('../../../src/streaming/kafka/manager'),
    configHandler = require('../../../src/configManager/models/configHandler');

describe('health check', function() {
    let sandbox;
    let kafkaManagerInitStub, kafkaManagerHealthStub, kafkaManagerCloseStub, kafkaManagerProduceStub;
    let configGetValueStub;

    before(function() {
        sandbox = sinon.createSandbox();
        kafkaManagerInitStub = sandbox.stub(kafkaManager, 'init');
        kafkaManagerHealthStub = sandbox.stub(kafkaManager, 'health');
        kafkaManagerCloseStub = sandbox.stub(kafkaManager, 'close');
        kafkaManagerProduceStub = sandbox.stub(kafkaManager, 'produce');
        configGetValueStub = sandbox.stub(configHandler, 'getConfigValue');
    });
    afterEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    describe('init', function() {
        let config;
        before(() => {
            streamingManager.__set__('streamingConfig', {
                platform: 'kafka'
            });

            config = {
                brokers: 'kafka:9092',
                topic: 'mickey'
            };
        });
        it('init kafka manager successfully', async function() {
            kafkaManagerInitStub.resolves();
            await streamingManager.init(config);
            expect(kafkaManagerInitStub.args[0][0]).eql(config);
        });
        it('init kafka manager failed - throw error', async function() {
            let expectedError;
            const kafkaError = new Error('failed to init kafka');
            kafkaManagerInitStub.rejects(kafkaError);
            try {
                await streamingManager.init(config);
                expect.to.fail();
            } catch (err) {
                expectedError = err;
            }
            expect(expectedError).to.eql(kafkaError);
        });
    });
    describe('health', function() {
        it('call kafka health when streaming manager initialized as kafka manager', async function() {
            streamingManager.__set__('streamingManager', {
                health: kafkaManagerHealthStub
            });

            kafkaManagerHealthStub.resolves();
            await streamingManager.health();
            expect(kafkaManagerHealthStub.calledOnce).eql(true);
        });
        it('should reject if streaming manager throws error on health', async function() {
            let expectedError;
            streamingManager.__set__('streamingManager', {
                health: kafkaManagerHealthStub
            });
            const streamerError = new Error('streaming platform health check failed');

            kafkaManagerHealthStub.rejects(streamerError);
            try {
                await streamingManager.health();
            } catch (err) {
                expectedError = err;
            }
            expect(kafkaManagerHealthStub.calledOnce).eql(true);
            expect(expectedError).to.eql(streamerError);
        });
        it('No call to streaming manager health when streaming manager is not initialized', async function() {
            streamingManager.__set__('streamingManager', undefined);
            kafkaManagerHealthStub.resolves();
            await streamingManager.health();
            expect(kafkaManagerHealthStub.calledOnce).eql(false);
        });
    });
    describe('close', function() {
        it('call kafka close when streaming manager initialized as kafka manager', async function() {
            streamingManager.__set__('streamingManager', {
                close: kafkaManagerCloseStub
            });

            kafkaManagerCloseStub.resolves();
            await streamingManager.close();
            expect(kafkaManagerCloseStub.calledOnce).eql(true);
        });
        it('No call to streaming manager close when streaming manager is not initialized', async function() {
            streamingManager.__set__('streamingManager', undefined);
            kafkaManagerCloseStub.resolves();
            await streamingManager.close();
            expect(kafkaManagerCloseStub.calledOnce).eql(false);
        });
    });
    describe('produce', function() {
        it('call kafka produce with StreamingMessage when streaming manager initialized as kafka manager', async function() {
            streamingManager.__set__('streamingManager', {
                produce: kafkaManagerProduceStub
            });
            configGetValueStub.resolves();
            kafkaManagerProduceStub.resolves();

            const metadata = {
                'load-testing': 'v4'
            };
            const event = 'job-created';
            const resource = {

            };
            await streamingManager.produce(metadata, event, resource);
            expect(kafkaManagerProduceStub.calledOnce).eql(true);
            expect(kafkaManagerProduceStub.args[0][0]).eql(JSON.stringify({
                metadata: { 'load-testing': 'v4', 'predator-version': '1.6.0' },
                event: 'job-created',
                resource: {}
            }));
        });
        it('No call to streaming manager produce when streaming manager is not initialized', async function() {
            streamingManager.__set__('streamingManager', undefined);
            kafkaManagerProduceStub.resolves();
            await streamingManager.produce();
            expect(kafkaManagerProduceStub.calledOnce).eql(false);
        });
    });
});