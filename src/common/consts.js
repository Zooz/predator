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
        DELAY_RUNNER_MS: 'delay_runner_ms',
        INTERNAL_ADDRESS: 'internal_address',
        RUNNER_DOCKER_IMAGE: 'runner_docker_image',
        JOB_PLATFORM: 'job_platform',
        RUNNER_CPU: 'runner_cpu',
        RUNNER_MEMORY: 'runner_memory',
        ALLOW_INSECURE_TLS: 'allow_insecure_tls',
        MINIMUM_WAIT_FOR_DELAYED_REPORT_STATUS_UPDATE_IN_MS: 'minimum_wait_for_delayed_report_status_update_in_ms',
        METRICS_PLUGIN_NAME: 'metrics_plugin_name',
        DEFAULT_EMAIL_ADDRESS: 'default_email_address',
        DEFAULT_WEBHOOK_URL: 'default_webhook_url',
        INFLUX_METRICS: 'influx_metrics',
        PROMETHEUS_METRICS: 'prometheus_metrics',
        SMTP_SERVER: 'smtp_server'
    }
};