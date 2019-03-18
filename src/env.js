let log = require('../src/common/logger');
let env = {};
const BY_PLATFORM_MANDATORY_VARS = {
    METRONOME: ['METRONOME_URL'],
    KUBERNETES: ['KUBERNETES_URL', 'KUBERNETES_NAMESPACE'],
    DOCKER: []

};
const SUPPORTED_PLATFORMS = Object.keys(BY_PLATFORM_MANDATORY_VARS);

const SUPPORTED_CASSANDRA_STRATEGY = ['SimpleStrategy', 'NetworkTopologyStrategy'];
const BY_DATABASE_MANDATORY_VARS = {
    CASSANDRA: ['DATABASE_NAME', 'DATABASE_ADDRESS', 'DATABASE_USERNAME', 'DATABASE_PASSWORD'],
    MYSQL: ['DATABASE_NAME', 'DATABASE_ADDRESS', 'DATABASE_USERNAME', 'DATABASE_PASSWORD'],
    POSTGRES: ['DATABASE_NAME', 'DATABASE_ADDRESS', 'DATABASE_USERNAME', 'DATABASE_PASSWORD'],
    MSSQL: ['DATABASE_NAME', 'DATABASE_ADDRESS', 'DATABASE_USERNAME', 'DATABASE_PASSWORD'],
    SQLITE: []

};
const SUPPORTED_DATABASES = Object.keys(BY_DATABASE_MANDATORY_VARS);

env.init = function () {
    if (!SUPPORTED_PLATFORMS.includes(process.env.JOB_PLATFORM)) {
        log.error(`JOB_PLATFORM should be one of: ${SUPPORTED_PLATFORMS}`);
        process.exit(1);
    }

    if (process.env.DATABASE_TYPE && !SUPPORTED_DATABASES.includes(process.env.DATABASE_TYPE)) {
        log.error(`DATABASE_TYPE should be one of: ${SUPPORTED_DATABASES}`);
        process.exit(1);
    }

    let mandatoryVars = [
        'JOB_PLATFORM',
        'INTERNAL_ADDRESS'
    ];

    mandatoryVars = mandatoryVars.concat(BY_PLATFORM_MANDATORY_VARS[process.env.JOB_PLATFORM]);

    if (process.env.DATABASE_TYPE) {
        mandatoryVars = mandatoryVars.concat(BY_DATABASE_MANDATORY_VARS[process.env.DATABASE_TYPE]);
    }

    let missingFields = mandatoryVars.filter((currVar) => {
        return !process.env[currVar];
    });

    if (missingFields.length > 0) {
        log.error('Missing mandatory environment variables', missingFields);
        process.exit(1);
    }

    if (process.env.CASSANDRA_KEY_SPACE_STRATEGY && !SUPPORTED_CASSANDRA_STRATEGY.includes(process.env.CASSANDRA_KEY_SPACE_STRATEGY)) {
        throw new Error('CASSANDRA_KEY_SPACE_STRATEGY not one of the supported values: ' + SUPPORTED_CASSANDRA_STRATEGY);
    }
    if (process.env.CASSANDRA_KEY_SPACE_STRATEGY === 'NetworkTopologyStrategy' && !process.env.CASSANDRA_LOCAL_DATA_CENTER) {
        throw new Error('When using CASSANDRA_KEY_SPACE_STRATEGY: NetworkTopologyStrategy, CASSANDRA_LOCAL_DATA_CENTER is mandatory');
    }
};

module.exports = env;