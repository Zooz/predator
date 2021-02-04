const MANDATORY_KAFKA_FIELDS = ['brokers', 'topic'];

function validateKafkaConfig(config) {
    const missingKeys = findMissingKeys(config, MANDATORY_KAFKA_FIELDS);

    if (missingKeys.length > 0) {
        const errorMsg = `Mandatory fields ${missingKeys.toString()} are missing`;
        throw new Error(errorMsg);
    }

    const { brokers } = config;
    if (!Array.isArray(brokers) || !(brokers.some(a => typeof a === 'string'))) {
        const errorMsg = 'Kafka brokers should be an array of strings';
        throw new Error(errorMsg);
    }
}

module.exports = {
    validateKafkaConfig
};

function findMissingKeys(config, mandatoryFields) {
    const missingKeys = [];
    mandatoryFields.forEach((key) => {
        if (!Object.keys(config).includes(key) || !config[key]) {
            missingKeys.push(key);
        }
    });
    return missingKeys;
}