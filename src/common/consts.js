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
        PROMETHEUS_PUSH_GATEWAY_URL: 'prometheus_push_gateway_url',
        PROMETHEUS_BUCKET_SIZES: 'prometheus_bucket_sizes',

        INFLUX_HOST: 'influx_host',
        INFLUX_USERNAME: 'influx_username',
        INFLUX_PASSWORD: 'influx_password',
        INFLUX_DATABASE: 'influx_database',

        SMTP_HOST: 'smtp_host',
        SMTP_PORT: 'smtp_port',
        SMTP_USERNAME: 'smtp_username',
        SMTP_PASSWORD: 'smtp_password',
        SMTP_FROM: 'smtp_from',
        SMTP_TIMEOUT: 'smtp_timeout'
    }
};