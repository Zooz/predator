module.exports = {
    TEST_TYPE_CUSTOM: 'custom',
    TEST_TYPE_DSL: 'dsl',
    ERROR_MESSAGES: {
        NOT_FOUND: 'Not found',
        DSL_DEF_ALREADY_EXIST: 'Definition already exists'
    },
    KUBERNETES: 'KUBERNETES',
    METRONOME: 'METRONOME',
    DOCKER: 'DOCKER',

    CONFIG: {
        GRFANA_URL: { name: 'grafana_url' },
        EXTERNAL_ADDRESS: { name: 'external_address' },
        INTERNAL_ADDRESS: { name: 'internal_address' },
        DOCKER_NAME: { name: 'docker_name' },
        JOB_PLATFORM: { name: 'job_platform' },
        RUNNER_CPU: { name: 'runner_cpu', type: 'int' },
        RUNNER_MEMORY: { name: 'runner_memory', type: 'int' },
        METRICS_PLUGIN_NAME: { name: 'metrics_plugin_name' },
        DEFAULT_EMAIL_ADDRESS: { name: 'default_email_address' },
        DEFAULT_WEBHOOK_URL: { name: 'DEFAULT_WEBHOOK_URL' },
        METRICS_EXPORT_CONF: { name: 'metrics_export_conf' },
        INFLUX_METRICS: { name: 'influx_metrics', type: 'json' },
        PROMETHEUS_METRICS: { name: 'prometheus_metrics', type: 'json' },
        SMTP_SERVER: { name: 'smtp_server', type: 'json' }
    }
};