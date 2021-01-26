const { expect } = require('chai'),
    rewire = require('rewire'),
    sinon = require('sinon');

const kafkaManager = rewire('../../../../src/streaming/kafka/manager'),
    { KafkaClient } = require('../../../../src/streaming/kafka/client');

describe('health check', function() {
    let KafkaClientStub;
    let sandbox;

    before(function() {
        sandbox = sinon.createSandbox();
        KafkaClientStub = sandbox.createStubInstance(KafkaClient);
    });
    beforeEach(() => {
        kafkaManager.__set__('kafkaClient', KafkaClientStub);
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
            config = {
                brokers: ['kafka1:9092', 'kafka2:9093'],
                topic: 'predator-tests'
            };
        });
        beforeEach(() => {
            kafkaManager.__set__('kafkaClient', undefined);
        });

        it('init kafka client not called if initialized already', async function() {
            kafkaManager.__set__('kafkaClient', KafkaClientStub);
            await kafkaManager.init(config);
            expect(KafkaClientStub.connectToBrokers.calledOnce).eql(false);
        });
        describe('input validations', async function() {
            it('brokers not an array', async function() {
                config = {
                    brokers: 'kafka:9092',
                    topic: 'mickey'
                };

                let expectedError;
                try {
                    await kafkaManager.init(config);
                } catch (err) {
                    expectedError = err;
                }
                expect(expectedError.message).to.eql('Kafka initializing failed with error: Kafka brokers should be an array of strings');
            });
            it('missing brokers parameter', async function() {
                config = {
                    topic: 'mickey'
                };

                let expectedError;
                try {
                    await kafkaManager.init(config);
                } catch (err) {
                    expectedError = err;
                }
                expect(expectedError.message).to.eql('Kafka initializing failed with error: Mandatory fields brokers are missing');
            });
            it('missing topic parameter', async function() {
                config = {
                    brokers: 'kafka:9092'
                };

                let expectedError;
                try {
                    await kafkaManager.init(config);
                } catch (err) {
                    expectedError = err;
                }
                expect(expectedError.message).to.eql('Kafka initializing failed with error: Mandatory fields topic are missing');
            });
        });
    });
    describe('produce', function() {
        it('should produce message successfully', async function() {
            KafkaClientStub.produce.resolves();
            const message = {
                metadata: {
                    runner: 'mickey'
                },
                event: 'job-created'
            };
            await kafkaManager.produce(message);
            expect(KafkaClientStub.produce.args[0][0]).eql([{
                value: message
            }]);
        });
        it('should throw error if produce message failed', async function() {
            let expectedError;
            KafkaClientStub.produce.rejects(new Error('failed to produce message to kafka'));
            try {
                await kafkaManager.produce();
            } catch (err) {
                expectedError = err;
            }
            expect(expectedError.message).eql('failed to produce message to kafka');
        });
    });
    describe('health', function() {
        it('successful health check', async function() {
            KafkaClientStub.kafkaHealthCheck.resolves();
            await kafkaManager.health();
        });
        it('failed health check should throw an error', async function() {
            let expectedError;
            KafkaClientStub.kafkaHealthCheck.rejects(new Error('failed to connect to kafka brokers'));
            try {
                await kafkaManager.health();
            } catch (err) {
                expectedError = err;
            }
            expect(expectedError.message).eql('Kafka health check failed with error: failed to connect to kafka brokers');
        });
    });
    describe('close', function() {
        it('successful disconnect', async function() {
            KafkaClientStub.closeKafka.resolves();
            await kafkaManager.close();
        });
        it('failed disconnect should not throw an error', async function() {
            let expectedError;
            KafkaClientStub.closeKafka.rejects(new Error('failed to close connection to kafka'));
            try {
                await kafkaManager.close();
            } catch (err) {
                expectedError = err;
            }
            expect(expectedError).eql(undefined);
        });
    });
});