const streamingConfig = require('../config/streamingConfig');

let streamingManager;

async function init(config) {
    streamingManager = require(`./${streamingConfig.platform}/manager`);
    await streamingManager.init(config);
}

async function health() {
    await streamingManager.health();
}

async function close() {
    await streamingManager.close();
}

async function produce(messages) {
    await streamingManager.produce(messages);
}

module.exports = {
    init,
    produce,
    health,
    close
};