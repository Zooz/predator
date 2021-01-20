const streamingConfig = require('../config/streamingConfig');
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

async function produce(message) {
    if (streamingManager) {
        await streamingManager.produce(message);
    }
}

module.exports = {
    init,
    produce,
    health,
    close
};