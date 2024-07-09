const EVENT_FORMAT_TYPE_SLACK = 'slack';
const EVENT_FORMAT_TYPE_JSON = 'json';
const EVENT_FORMAT_TYPE_TEAMS = 'teams';
const EVENT_FORMAT_TYPE_DISCORD = 'discord';
const WEBHOOK_EVENT_TYPE_STARTED = 'started';
const WEBHOOK_EVENT_TYPE_FINISHED = 'finished';
const WEBHOOK_EVENT_TYPE_API_FAILURE = 'api_failure';
const WEBHOOK_EVENT_TYPE_ABORTED = 'aborted';
const WEBHOOK_EVENT_TYPE_FAILED = 'failed';
const WEBHOOK_EVENT_TYPE_IN_PROGRESS = 'in_progress';
const WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED = 'benchmark_passed';
const WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED = 'benchmark_failed';
const WEBHOOK_SLACK_DEFAULT_MESSAGE_ICON = ':muscle:';
const WEBHOOK_DEFAULT_REPORTER_NAME = 'Predator';
const WEBHOOK_TEAMS_DEFAULT_THEME_COLOR = '957c58';

module.exports = {
    CONTEXT_ID: 'context_id',
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
    WEBHOOK_EVENT_TYPE_IN_PROGRESS,
    EVENT_FORMAT_TYPE_SLACK,
    EVENT_FORMAT_TYPE_JSON,
    EVENT_FORMAT_TYPE_TEAMS,
    EVENT_FORMAT_TYPE_DISCORD,
    WEBHOOK_SLACK_DEFAULT_MESSAGE_ICON,
    WEBHOOK_DEFAULT_REPORTER_NAME,
    WEBHOOK_TEAMS_DEFAULT_THEME_COLOR,
    EVENT_FORMAT_TYPES: [
        EVENT_FORMAT_TYPE_SLACK,
        EVENT_FORMAT_TYPE_JSON,
        EVENT_FORMAT_TYPE_TEAMS,
        EVENT_FORMAT_TYPE_DISCORD
    ],
    WEBHOOK_EVENT_TYPES: [
        WEBHOOK_EVENT_TYPE_STARTED,
        WEBHOOK_EVENT_TYPE_FINISHED,
        WEBHOOK_EVENT_TYPE_API_FAILURE,
        WEBHOOK_EVENT_TYPE_ABORTED,
        WEBHOOK_EVENT_TYPE_FAILED,
        WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED,
        WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED,
        WEBHOOK_EVENT_TYPE_IN_PROGRESS
    ],
    ERROR_MESSAGES: {
        NOT_FOUND: 'Not found',
        DSL_DEF_ALREADY_EXIST: 'Definition already exists',
        CHAOS_EXPERIMENT_NAME_ALREADY_EXIST: 'Chaos experiment name already exists',
        CHAOS_EXPERIMENT_SUPPORTED_ONLY_IN_KUBERNETES: 'Chaos experiment is supported only in kubernetes jobs',
        CHAOS_EXPERIMENTS_NOT_EXIST_FOR_JOB: 'One or more chaos experiments are not configured. Job can not be created',
        PROCESSOR_NAME_ALREADY_EXIST: 'Processor name already exists',
        PROCESSOR_DELETION_FORBIDDEN: 'Processor is used by tests'
    },
    WARN_MESSAGES: {
        BAD_RUNNER_IMAGE: 'It is recommended to use the same MAJOR.MINOR version for both Predator and Predator-Runner docker images in order to be fully compatible with all of the features'
    },
    KUBERNETES: 'KUBERNETES',
    AWS_FARGATE: 'AWS_FARGATE',
    METRONOME: 'METRONOME',
    DOCKER: 'DOCKER',
    WEBHOOK_TEST_MESSAGE: 'Hello From Predator! Wuff! Wuff!',
    WEBHOOK_GRAVATAR_URL: 'https://www.gravatar.com/avatar/af577df746d71dfc4a7ab9f76202f9b8',
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
        MINIMUM_WAIT_FOR_CHAOS_EXPERIMENT_DELETION_IN_MS: 'minimum_wait_for_chaos_experiment_deletion_in_ms',
        METRICS_PLUGIN_NAME: 'metrics_plugin_name',
        DEFAULT_EMAIL_ADDRESS: 'default_email_address',
        DEFAULT_WEBHOOK_URL: 'default_webhook_url',
        INFLUX_METRICS: 'influx_metrics',
        PROMETHEUS_METRICS: 'prometheus_metrics',
        SMTP_SERVER: 'smtp_server',
        BENCHMARK_THRESHOLD: 'benchmark_threshold',
        BENCHMARK_THRESHOLD_WEBHOOK_URL: 'benchmark_threshold_webhook_url',
        BENCHMARK_WEIGHTS: 'benchmark_weights',
        CUSTOM_RUNNER_DEFINITION: 'custom_runner_definition',
        STREAMING_EXCLUDED_ATTRIBUTES: 'streaming_excluded_attributes'
    }
};
