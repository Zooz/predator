const streamingConfig = require('../config/streamingConfig'),
    StreamingMessage = require('./entities/message');

let streamingManager;

async function init(config) {
    streamingManager = require(`./${streamingConfig.platform}/manager`);
    await streamingManager.init(config);
}

async function health() {
    if (streamingManager) {
        await streamingManager.health();
    }
}

async function close() {
    if (streamingManager) {
        await streamingManager.close();
    }
}

async function produce(metadata, event, resource) {
    if (streamingManager) {
        const streamingMessage = new StreamingMessage(metadata, event, resource);
        const messageToProduce = await streamingMessage.getMessage();
        await streamingManager.produce(messageToProduce);
    }
}

module.exports = {
    init,
    produce,
    health,
    close
};