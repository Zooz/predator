module.exports = {
    TEST_TYPE_BASIC: 'basic',
    TEST_TYPE_DSL: 'dsl',
    ERROR_MESSAGES: {
        NOT_FOUND: 'Not found',
        DSL_DEF_ALREADY_EXIST: 'Definition already exists'
    },
    KUBERNETES: 'KUBERNETES',
    METRONOME: 'METRONOME',
    DOCKER: 'DOCKER',

    CONFIG: {
        GRFANA_URL: 'grafana_url',
        INTERNAL_ADDRESS: 'internal_address',
        DOCKER_NAME: 'docker_name',
        JOB_PLATFORM: 'job_platform',
        RUNNER_CPU: 'runner_cpu',
        RUNNER_MEMORY: 'runner_memory',
        MINIMUM_WAIT_FOR_DELAYED_REPORT_STATUS_UPDATE_IN_MS: 'minimum_wait_for_delayed_report_status_update_in_ms',
        METRICS_PLUGIN_NAME: 'metrics_plugin_name',
        DEFAULT_EMAIL_ADDRESS: 'default_email_address',
        DEFAULT_WEBHOOK_URL: 'default_webhook_url',
        INFLUX_METRICS: 'influx_metrics',
        PROMETHEUS_METRICS: 'prometheus_metrics',
        SMTP_SERVER: 'smtp_server'
    },

    INNER_CONFIGS: {
        PROMETHEUS_PUSH_GATEWAY_URL: 'push_gateway_url',
        PROMETHEUS_BUCKET_SIZES: 'bucket_sizes',

        INFLUX_HOST: 'host',
        INFLUX_USERNAME: 'username',
        INFLUX_PASSWORD: 'password',
        INFLUX_DATABASE: 'database',

        SMTP_HOST: 'host',
        SMTP_PORT: 'port',
        SMTP_USERNAME: 'username',
        SMTP_PASSWORD: 'password',
        SMTP_FROM: 'from',
        SMTP_TIMEOUT: 'timeout'
    }
};