let config = {
    grafanaUrl: process.env.GRAFANA_URL,
    externalAddress: process.env.EXTERNAL_ADDRESS || process.env.INTERNAL_ADDRESS,
    internalAddress: process.env.INTERNAL_ADDRESS,
    concurrencyLimit: process.env.CONCURRENCY_LIMIT || 500,
    dockerName: process.env.DOCKER_NAME || 'zooz/predator-runner:latest',
    jobPlatform: process.env.JOB_PLATFORM,
    runnerCpu: parseInt(process.env.RUNNER_CPU || 1),
    runnerMemory: parseInt(process.env.RUNNER_MEMORY || 2048),
    metricsPluginName: process.env.METRICS_PLUGIN_NAME,
    metricsExportConfig: process.env.METRICS_EXPORT_CONFIG
};

module.exports = config;