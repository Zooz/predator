const config = {
    platform: process.env.STREAMING_PLATFORM && process.env.STREAMING_PLATFORM.toLowerCase(),
    healthCheckTimeout: parseInt(process.env.STREAMING_PLATFORM_HEALTH_CHECK_TIMEOUT_MS) || 2000
};

module.exports = config;