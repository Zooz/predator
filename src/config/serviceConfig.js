let config = {
    grafanaUrl: process.env.GRAFANA_URL,
    myAddress: process.env.MY_ADDRESS,
    pushGatewayUrl: process.env.PUSH_GATEWAY_URL,
    concurrencyLimit: process.env.CONCURRENCY_LIMIT || 500,
    dockerName: process.env.DOCKER_NAME || 'enudler/predator-runner',
    jobPlatform: process.env.JOB_PLATFORM,
    runnerCpu: process.env.RUNNER_CPU || '1',
    runnerMemory: process.env.RUNNER_MEMORY || '2048',
    metricsPluginName: process.env.METRICS_PLUGIN_NAME,
    metricsExportConfig: process.env.METRICS_EXPORT_CONFIG
};

module.exports = config;