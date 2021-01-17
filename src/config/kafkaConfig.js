const config = {
    clientId: process.env.KAFKA_CLIENT_ID,
    brokers: process.env.KAFKA_BROKERS,
    topic: process.env.KAFKA_TOPIC,
    allowAutoTopicCreation: process.env.KAFKA_ALLOW_AUTO_TOPIC_CREATION === 'true',
    adminRetries: parseInt(process.env.KAFKA_ADMIN_RETRIES) || 2
};

module.exports = config;