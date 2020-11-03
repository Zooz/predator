const logger = require('../src/common/logger');
const { WARN_MESSAGES } = require('./common/consts');
const runnerValidator = require('./common/validateRunnerVersion');

const env = {};
const BY_PLATFORM_MANDATORY_VARS = {
    METRONOME: ['METRONOME_URL'],
    KUBERNETES: ['KUBERNETES_URL', 'KUBERNETES_NAMESPACE'],
    DOCKER: [],
    AWS_FARGATE: []
};
const SUPPORTED_PLATFORMS = Object.keys(BY_PLATFORM_MANDATORY_VARS);

const BY_DATABASE_MANDATORY_VARS = {
    MYSQL: ['DATABASE_NAME', 'DATABASE_ADDRESS', 'DATABASE_USERNAME', 'DATABASE_PASSWORD'],
    POSTGRES: ['DATABASE_NAME', 'DATABASE_ADDRESS', 'DATABASE_USERNAME', 'DATABASE_PASSWORD'],
    MSSQL: ['DATABASE_NAME', 'DATABASE_ADDRESS', 'DATABASE_USERNAME', 'DATABASE_PASSWORD'],
    SQLITE: []

};
const SUPPORTED_DATABASES = Object.keys(BY_DATABASE_MANDATORY_VARS);

env.init = function () {
    if (!SUPPORTED_PLATFORMS.includes(String(process.env.JOB_PLATFORM).toUpperCase())) {
        logger.error(`JOB_PLATFORM should be one of: ${SUPPORTED_PLATFORMS}`);
        process.exit(1);
    }

    if (process.env.DATABASE_TYPE && !SUPPORTED_DATABASES.includes(String(process.env.DATABASE_TYPE).toUpperCase())) {
        logger.error(`DATABASE_TYPE should be one of: ${SUPPORTED_DATABASES}`);
        process.exit(1);
    }

    let mandatoryVars = [
        'JOB_PLATFORM',
        'INTERNAL_ADDRESS'
    ];

    mandatoryVars = mandatoryVars.concat(BY_PLATFORM_MANDATORY_VARS[String(process.env.JOB_PLATFORM).toUpperCase()]);

    if (process.env.DATABASE_TYPE) {
        mandatoryVars = mandatoryVars.concat(BY_DATABASE_MANDATORY_VARS[String(process.env.DATABASE_TYPE).toUpperCase()]);
    }

    const missingFields = mandatoryVars.filter((currVar) => {
        return !process.env[currVar];
    });

    if (missingFields.length > 0) {
        logger.error(missingFields, 'Missing mandatory environment variables');
        process.exit(1);
    }

    if (process.env.RUNNER_DOCKER_IMAGE && !runnerValidator.isBestRunnerVersionToUse(process.env.RUNNER_DOCKER_IMAGE)) {
        logger.warn(WARN_MESSAGES.BAD_RUNNER_IMAGE);
    }
};

module.exports = env;
