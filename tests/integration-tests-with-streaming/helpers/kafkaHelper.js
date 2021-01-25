const { Kafka } = require('kafkajs');

const defaultRetriesOptions = {
    retries: 30,
    minTimeout: 500,
    factor: 1
};

class KafkaHelper {
    constructor(topic, brokers) {
        this.addTestRequired();
        this.topic = topic;
        this.brokers = brokers;
        this.lastMsgs = [];
    }

    addTestRequired() {
        this.retry = require('async-retry');
        this.uuid = require('uuid');
    }

    async init() {
        const kafka = new Kafka({
            clientId: 'test-kafka-streaming',
            brokers: this.brokers || [`${process.env.RUNNER_IP}:9092`]
        });
        this.consumer = kafka.consumer({ groupId: `test-kafka-streaming${this.uuid.v4()}` });
    }

    async startConsuming() {
        await this.consumer.connect();
        await this.consumer.subscribe({ topic: this.topic });
        return this.consumer.run({
            autoCommit: true,
            eachMessage: async ({ message }) => {
                this.lastMsgs.push({
                    key: message.key ? message.key.toString() : undefined,
                    value: message.value.toString(),
                    headers: message.headers
                });
            }
        });
    }

    async getLastMsgs(size = 1) {
        const lastMsgValue = await this.retry(() => {
            if (this.lastMsgs.length !== size) {
                throw Error(`Fail to consume last msgs last msg size: ${this.lastMsgs.length} expected to be: ${size}`);
            }
            return this.lastMsgs;
        }, defaultRetriesOptions);
        this.clearMsgs();
        return lastMsgValue;
    }

    async clearMsgs() {
        this.lastMsgs = [];
    }

    async disconnect() {
        await this.consumer.disconnect();
    }
}

module.exports = {
    KafkaHelper
};
