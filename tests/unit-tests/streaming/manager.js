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
    let newDateStub;

    before(function() {
        sandbox = sinon.createSandbox();
        kafkaManagerInitStub = sandbox.stub(kafkaManager, 'init');
        kafkaManagerHealthStub = sandbox.stub(kafkaManager, 'health');
        kafkaManagerCloseStub = sandbox.stub(kafkaManager, 'close');
        kafkaManagerProduceStub = sandbox.stub(kafkaManager, 'produce');
        configGetValueStub = sandbox.stub(configHandler, 'getConfigValue');
        newDateStub = sandbox.stub(Date.prototype, 'constructor');
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
        it('should reject if streaming manager times out on health check', async function() {
            this.timeout(5000);
            let expectedError;
            streamingManager.__set__('streamingManager', {
                health: kafkaManagerHealthStub
            });
            streamingManager.__set__('streamingConfig', {
                healthCheckTimeout: 2000
            });

            kafkaManagerHealthStub.callsFake(async () => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 3000);
                });
            });

            try {
                await streamingManager.health();
            } catch (err) {
                expectedError = err;
            }
            expect(kafkaManagerHealthStub.calledOnce).eql(true);
            expect(expectedError.message).to.eql('streaming platform health check timed out after 2000ms');
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
            const newDate = new Date();
            newDateStub.returns(newDate);

            const metadata = {
                'load-testing': 'v4'
            };
            const event = 'job-created';
            const resource = {
                test_id: 'test_id',
                report_id: 'report_id',
                job_id: 'job_id',

                test_name: 'mickeys test',
                description: 'some description',
                revision_id: 'revision_id',
                artillery_test: {
                    config: {
                        name: 'mickeys test'
                    }
                },

                job_type: 'functional_test',
                max_virtual_users: 100,
                arrival_count: 6,
                parallelism: 1,

                start_time: 'start_time',
                end_time: 'end_time',
                notes: 'notes',
                duration: 6,
                status: 'Finished',
                intermediates: [
                    {
                        rps: {
                            99: '10.383'
                        }
                    },
                    {
                        rps: {
                            99: '16.593'
                        }
                    }
                ],
                aggregate: {
                    rps: {
                        99: '10.383'
                    }
                }
            };
            await streamingManager.produce(metadata, event, resource);
            expect(kafkaManagerProduceStub.calledOnce).eql(true);
            expect(kafkaManagerProduceStub.args[0][0]).eql(JSON.stringify({
                published_at: newDate,
                metadata: {
                    'load-testing': 'v4',
                    'predator-version': '1.6.0'
                },
                event: 'job-created',
                resource: {
                    test_id: 'test_id',
                    report_id: 'report_id',
                    job_id: 'job_id',
                    test_name: 'mickeys test',
                    description: 'some description',
                    revision_id: 'revision_id',
                    artillery_test: {
                        config: {
                            name: 'mickeys test'
                        }
                    },
                    job_type: 'functional_test',
                    max_virtual_users: 100,
                    arrival_count: 6,
                    parallelism: 1,
                    start_time: 'start_time',
                    end_time: 'end_time',
                    notes: 'notes',
                    duration: 6,
                    status: 'Finished',
                    intermediates: [{
                        rps: {
                            99: '10.383'
                        }
                    }, {
                        rps: {
                            99: '16.593'
                        }
                    }],
                    aggregate: {
                        rps: {
                            99: '10.383'
                        }
                    }
                }
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