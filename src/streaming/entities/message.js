const StreamingResource = require('./resource'),
    configHandler = require('../../configManager/models/configHandler');

const { CONFIG: configConstants } = require('../../common/consts'),
    { version: PREDATOR_VERSION } = require('../../../package.json');

class StreamingMessage {
    constructor(metadata, event, resource) {
        this.published_at = new Date();
        this.metadata = metadata;
        this.event = event;
        this.resource = new StreamingResource(resource);
    }

    async getMessage() {
        const resourceWithoutExcludedAttributes = await deleteExcludedAttributes(this.resource);
        const defaultMetadata = await buildDefaultMetadata();
        const metadata = { ...this.metadata, ...defaultMetadata };
        return JSON.stringify({
            published_at: this.published_at,
            metadata: metadata,
            event: this.event,
            resource: resourceWithoutExcludedAttributes
        });
    }
}

async function deleteExcludedAttributes(resource) {
    const newResource = { ...resource };
    const streamingExcludedAttributes = await configHandler.getConfigValue(configConstants.STREAMING_EXCLUDED_ATTRIBUTES);
    streamingExcludedAttributes && streamingExcludedAttributes.forEach(attribute => delete newResource[attribute]);
    return newResource;
}

async function buildDefaultMetadata() {
    const runnerDockerImage = await configHandler.getConfigValue(configConstants.RUNNER_DOCKER_IMAGE);
    return {
        'predator-version': PREDATOR_VERSION,
        'runner-docker-image': runnerDockerImage
    };
}

module.exports = StreamingMessage;