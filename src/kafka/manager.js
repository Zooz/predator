const { defaultKafkaValues } = require('./common');
const logger = require('../common/logger');
const { KafkaClient } = require('./client');
const { validateKafkaConfig } = require('./validator');
const { createStatusObj } = require('../helpers/healthcheckUtils');

let kafkaClient;
let localConfig;

async function init(config) {
    try {
        if (!kafkaClient) {
            validateKafkaConfig(config);
            localConfig = buildLocalConfig(config);
            kafkaClient = new KafkaClient(localConfig);
            logger.info('Kafka client initializing started');
            await kafkaClient.connectToBrokers();
            logger.info('Kafka client initialized successfully');
        }
    } catch (error) {
        const errorStr = `Kafka initializing failed with error: ${error.message}`;
        logger.error(errorStr);
    }
}

async function healthCheck() {
    try {
        await kafkaClient.kafkaHealthCheck();
        logger.debug('Kafka health check passed');
        return createStatusObj('ok');
    } catch (error) {
        init(localConfig);
        const errorStr = `Kafka health check failed with error ${error.message} , trying to reconnect`;
        logger.error(errorStr);
        return createStatusObj('failed', error.message);
    }
}

async function close() {
    try {
        logger.info('Closing Kafka connection');
        await kafkaClient.closeKafka();
        logger.info('Kafka connections were closed successfully.');
    } catch (error) {
        const errorStr = `Kafka disconnect failed with error ${error}`;
        logger.error(errorStr);
    }
}

async function produce(messages) {
    try {
        await kafkaClient.produce(messages);
        logger.debug('Produced message to kafka');
    } catch (error) {
        logger.error(`Failed to produce message to kafka with error ${error.message}. stack ${error.stack}`);
        throw error;
    }
}

module.exports = {
    init,
    produce,
    healthCheck,
    close
};

function buildLocalConfig(config) {
    return {
        kafkaConfig: {
            clientId: config.clientId,
            brokers: config.brokers,
            topic: config.topic
        },
        producerConfig: {
            allowAutoTopicCreation: config.allowAutoTopicCreation
        },
        adminConfig: {
            retry: config.adminRetries
        }
    };
}