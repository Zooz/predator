const EVENT_FORMAT_TYPE_SLACK = 'slack';
const EVENT_FORMAT_TYPE_JSON = 'json';
const WEBHOOK_EVENT_TYPE_STARTED = 'started';
const WEBHOOK_EVENT_TYPE_FINISHED = 'finished';
const WEBHOOK_EVENT_TYPE_API_FAILURE = 'api_failure';
const WEBHOOK_EVENT_TYPE_ABORTED = 'aborted';
const WEBHOOK_EVENT_TYPE_FAILED = 'failed';
const WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED = 'benchmark_passed';
const WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED = 'benchmark_failed';

module.exports = {
    TEST_TYPE_BASIC: 'basic',
    TEST_TYPE_DSL: 'dsl',
    JOB_TYPE_LOAD_TEST: 'load_test',
    JOB_TYPE_FUNCTIONAL_TEST: 'functional_test',
    PROCESSOR_FUNCTIONS_KEYS: ['beforeScenario', 'afterScenario', 'beforeRequest', 'afterResponse'],
    WEBHOOK_EVENT_TYPE_STARTED,
    WEBHOOK_EVENT_TYPE_FINISHED,
    WEBHOOK_EVENT_TYPE_API_FAILURE,
    WEBHOOK_EVENT_TYPE_ABORTED,
    WEBHOOK_EVENT_TYPE_FAILED,
    WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED,
    WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED,
    EVENT_FORMAT_TYPE_SLACK,
    EVENT_FORMAT_TYPE_JSON,
    EVENT_FORMAT_TYPES: [
        EVENT_FORMAT_TYPE_SLACK,
        EVENT_FORMAT_TYPE_JSON
    ],
    WEBHOOK_EVENT_TYPES: [
        WEBHOOK_EVENT_TYPE_STARTED,
        WEBHOOK_EVENT_TYPE_FINISHED,
        WEBHOOK_EVENT_TYPE_API_FAILURE,
        WEBHOOK_EVENT_TYPE_ABORTED,
        WEBHOOK_EVENT_TYPE_FAILED,
        WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED,
        WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED
    ],
    ERROR_MESSAGES: {
        NOT_FOUND: 'Not found',
        DSL_DEF_ALREADY_EXIST: 'Definition already exists',
        PROCESSOR_NAME_ALREADY_EXIST: 'Processor name already exists',
        PROCESSOR_DELETION_FORBIDDEN: 'Processor is used by tests'
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
        INTERVAL_CLEANUP_FINISHED_CONTAINERS_MS: 'interval_cleanup_finished_containers_ms',
        MINIMUM_WAIT_FOR_DELAYED_REPORT_STATUS_UPDATE_IN_MS: 'minimum_wait_for_delayed_report_status_update_in_ms',
        METRICS_PLUGIN_NAME: 'metrics_plugin_name',
        DEFAULT_EMAIL_ADDRESS: 'default_email_address',
        DEFAULT_WEBHOOK_URL: 'default_webhook_url',
        INFLUX_METRICS: 'influx_metrics',
        PROMETHEUS_METRICS: 'prometheus_metrics',
        SMTP_SERVER: 'smtp_server',
        BENCHMARK_THRESHOLD: 'benchmark_threshold',
        BENCHMARK_THRESHOLD_WEBHOOK_URL: 'benchmark_threshold_webhook_url',
        BENCHMARK_WEIGHTS: 'benchmark_weights',
        CUSTOM_RUNNER_DEFINITION: 'custom_runner_definition'
    }
};
