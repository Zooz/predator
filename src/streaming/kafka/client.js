const { Kafka } = require('kafkajs');

const logger = require('../../common/logger');

class KafkaClient {
    constructor(config) {
        this.config = { ...config, ...config.kafkaConfig };
    }

    async connectToBrokers() {
        this.kafka = new Kafka(this.config.kafkaConfig);
        this.producer = this.kafka.producer(this.config.producerConfig);
        this.admin = this.kafka.admin(this.config.adminConfig);
        await Promise.all([this.admin.connect(), this.producer.connect()]);
    }

    async closeKafka() {
        await Promise.all([this.admin.disconnect(), this.producer.disconnect()]);
    }

    async kafkaHealthCheck() {
        const topicsMetadata = await this.admin.fetchTopicMetadata(this.config.topic);
        if (topicsMetadata.topics.length === 0) {
            logger.error(`The topic ${this.config.topic} doesn't exist in Kafka`);
        }
        return topicsMetadata;
    }

    async produce(messages) {
        const { topic } = this.config;
        const produceBody = { topic, messages };
        await this.producer.send(produceBody);
    }
}

module.exports = {
    KafkaClient
};