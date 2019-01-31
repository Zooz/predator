// let log = require('./helpers/logger');
// let env = {};
// const BY_PLATFORM_MANDATORY_VARS = {
//     METRONOME: ['METRONOME_URL'],
//     KUBERNETES: ['KUBERNETES_URL', 'KUBERNETES_NAMESPACE']
// };
// const SUPPORTED_PLATFORMS = Object.keys(BY_PLATFORM_MANDATORY_VARS);
//
// const BY_DATABASE_MANDATORY_VARS = {
//     CASSANDRA: [],
//     MYSQL: [],
//     POSTGRES: [],
//     MSSQL: [],
//     SQLITE: ['SQLITE_STORAGE']
//
// };
// const SUPPORTED_DATABASES = Object.keys(BY_DATABASE_MANDATORY_VARS);
//
// env.init = function () {
//
//     if (!SUPPORTED_PLATFORMS.includes(process.env.JOB_PLATFORM)) {
//         log.error(`JOB_PLATFORM should be one of: ${SUPPORTED_PLATFORMS}`);
//         process.exit(1);
//     }
//
//     if (!SUPPORTED_DATABASES.includes(process.env.DATABASE_TYPE)) {
//         log.error(`DATABASE_TYPE should be one of: ${SUPPORTED_DATABASES}`);
//         process.exit(1);
//     }
//
//     let mandatoryVars = [
//         'TESTS_API_URL',
//         'ENVIRONMENT',
//         'CLUSTER',
//         'CONCURRENCY_LIMIT',
//         'DOCKER_NAME',
//         'JOB_PLATFORM',
//         'DATABASE_TYPE',
//         'DATABASE_NAME',
//         'DATABASE_ADDRESS',
//         'DATABASE_USERNAME',
//         'DATABASE_PASSWORD'
//     ];
//
//     mandatoryVars = mandatoryVars.concat(BY_PLATFORM_MANDATORY_VARS[process.env.JOB_PLATFORM]);
//     mandatoryVars = mandatoryVars.concat(BY_DATABASE_MANDATORY_VARS[process.env.DATABASE_TYPE]);
//
//     let missingFields = mandatoryVars.filter((currVar) => {
//         return !process.env[currVar];
//     });
//
//     if (missingFields.length > 0) {
//         log.error('Missing mandatory environment variables', missingFields);
//         process.exit(1);
//     }
// };
//
// module.exports = env;