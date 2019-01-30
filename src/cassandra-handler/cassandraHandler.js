'use strict';

let cassandra = require('cassandra-driver'),
    cassandraConfig = require('../config/databaseConfig'),
    client;
let args;
let fs = require('fs-extra');
let cmd = require('node-cmd');
let logger = require('../helpers/logger');
let path = require('path');
let CREATE_KEY_SPACE_QUERY;
const CONSISTENCY_POLICY = cassandra.types.consistencies.localOne;
const MAX_FETCH_SIZE = 1000;
const isDevMode = process.env.DEV_MODE === 'true';

let initFileNameTemplate = 'cassandra_config_template.json',
    initFileName = 'cassandra_config.json';

let cassandraHandlerLogContext = {
    'x-zooz-request-id': 'service-startup',
    'key_space_name': cassandraConfig.name,
    'initFileNameTemplate': initFileNameTemplate,
    'init_file_name': initFileName
};

const options = {
    prepare: true,
    consistency: cassandra.types.consistencies.quorum
};

module.exports.initArgs = initArgs;
module.exports.closeCassandraConnection = closeCassandraConnection;
module.exports.initCassandraConnection = initCassandraConnection;

module.exports.initializeCassandraEnvironment = function () {
    initArgs();

    return initCassandraConnection()
        .then(function () {
            CREATE_KEY_SPACE_QUERY = 'CREATE KEYSPACE IF NOT EXISTS ' +
                args.key_space_name +
                " WITH replication = {'class': 'SimpleStrategy', 'replication_factor':" +
                args.replication_factor + '}';
            return createKeySpaceIfNeeded();
        })
        .then(function () {
            return closeCassandraConnection();
        })
        .then(function () {
            return createConfigTemplateFile();
        })
        .then(function () {
            if (!isDevMode) {
                return runCassandraScripts();
            }
        })
        .then(function () {
            return removeConfigFile();
        })
        .then(function () {
            initKeyspaceCassandraConnection(args.key_space_name);
            cassandraHandlerLogContext = {
                'x-zooz-request-id': 'service-startup',
                'key_space_name': cassandraConfig.name
            };
        })
        .catch(function (error) {
            cassandraHandlerLogContext.initialize_cassandra_environment_error = error;
            logger.error(cassandraHandlerLogContext, 'Cassandra handler: error occurred while trying to init cassandra credentials');
            process.exit(1);
        });
};

module.exports.ping = function (keyspace) {
    return new Promise(function (resolve, reject) {
        const query = 'SELECT * FROM system_schema.keyspaces where keyspace_name=?';
        let queryParams = [keyspace];

        client.execute(query, queryParams, options)
            .then(function (results) {
                if (!results.rows || results.rows.length <= 0) {
                    return reject(new Error('Key space doesn\'t found'));
                } else {
                    return resolve(true);
                }
            }).catch(function (error) {
                return reject(error);
            });
    });
};

function initArgs() {
    args = {
        key_space_name: cassandraConfig.name,
        cassandra_url: cassandraConfig.address,
        replication_factor: cassandraConfig.cassandraReplicationFactor,
        cassandra_username: cassandraConfig.username,
        cassandra_password: cassandraConfig.password,
        root_dir: path.join(__dirname, '../../')
    };
}

function closeCassandraConnection() {
    logger.info(cassandraHandlerLogContext, 'Cassandra handler: closing cassandra connection');
    return new Promise(function (resolve, reject) {
        if (client) {
            client.shutdown(function (err) {
                if (err) {
                    cassandraHandlerLogContext.client_shutdown_err = err;
                    logger.error(cassandraHandlerLogContext, 'Cassandra handler: failed to close Cassandra connection.');
                    reject(err);
                } else {
                    logger.info(cassandraHandlerLogContext, 'Cassandra handler: connection was closed successfully');
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

function runCassandraScripts() {
    return new Promise(function (resolve, reject) {
        let initCmd = path.join(args.root_dir, '/node_modules/.bin/cassandra-migration');
        let initConfigPath = path.join(args.root_dir, '/src/cassandra-handler', initFileName);
        logger.info(cassandraHandlerLogContext, 'Cassandra handler: running migration scripts');

        cmd.get(
            initCmd + ' ' + initConfigPath,
            function (err, data, stderr) {
                if (err) {
                    cassandraHandlerLogContext.run_cassandra_scripts_err = err || stderr;
                    cassandraHandlerLogContext.run_cassandra_scripts_stderr = stderr;
                    logger.error(cassandraHandlerLogContext, 'Cassandra handler: failed running cassandra migration scripts');
                    reject(err || stderr);
                }
                cassandraHandlerLogContext.run_cassandra_scripts_output = data;
                logger.info(cassandraHandlerLogContext, 'Cassandra handler: successfully ran cassandra migration scripts');
                delete cassandraHandlerLogContext.run_cassandra_scripts_output;
                resolve();
            }
        );
    });
}

function removeConfigFile() {
    return new Promise(function (resolve, reject) {
        logger.trace(cassandraHandlerLogContext, 'Cassandra handler: removiung cassandra migration config file');
        fs.remove(path.join(args.root_dir, '/src/cassandra-handler/', initFileName), function (err) {
            if (err) {
                cassandraHandlerLogContext.remove_config_file_err = err;
                logger.error(cassandraHandlerLogContext, 'Cassandra handler: could not remove cassandra migration config file');
                reject(err);
            }

            logger.info(cassandraHandlerLogContext, 'Cassandra handler: successfully removed cassandra migration config file');
            resolve();
        });
    });
}

function createConfigTemplateFile() {
    return new Promise(function (resolve, reject) {
        let templateJsonFile = require('./' + initFileNameTemplate);

        templateJsonFile.migrationsDir = path.join(args.root_dir, 'src/cassandra-handler/init-scripts');
        templateJsonFile.cassandra.contactPoints = args.cassandra_url.split(',');
        templateJsonFile.cassandra.keyspace = args.key_space_name;
        templateJsonFile.auth.username = args.cassandra_username;
        templateJsonFile.auth.password = args.cassandra_password;

        logger.trace(cassandraHandlerLogContext, 'Cassandra handler: set init templateJsonFile');

        fs.writeFile(path.join(args.root_dir, '/src/cassandra-handler/', initFileName), JSON.stringify(templateJsonFile, null, 2), function (err) {
            if (err) {
                cassandraHandlerLogContext.remove_config_template_file_err = err;
                logger.error(cassandraHandlerLogContext, 'Cassandra handler: could not write to cassandra init file');
                reject(err);
            }
            logger.info(cassandraHandlerLogContext, 'Cassandra handler: successfully wrote to cassandra init file');
            resolve();
        });
    });
}

function initCassandraConnection() {
    return new Promise(function (resolve, reject) {
        client = new cassandra.Client(buildClient(undefined));
        resolve();
    });
}

function initKeyspaceCassandraConnection(keyspace) {
    return new Promise(function (resolve, reject) {
        client = new cassandra.Client(buildClient(keyspace));

        logger.info(cassandraHandlerLogContext, 'Cassandra Handler: Successfully connected to cassandra keyspace');
        resolve();
    });
}

function buildClient(keyspace) {
    let authProvider = new cassandra.auth.PlainTextAuthProvider(args.cassandra_username, args.cassandra_password);
    let cassandraClient = {
        contactPoints: args.cassandra_url.split(','),
        authProvider: authProvider
    };

    if (keyspace) {
        cassandraClient['keyspace'] = keyspace;
    } else {
        cassandraClient['queryOptions'] = {
            consistency: CONSISTENCY_POLICY,
            fetchSize: MAX_FETCH_SIZE
        };
    }

    logger.trace(cassandraHandlerLogContext, 'Cassandra Handler: set client configuration');
    return cassandraClient;
}

function createKeySpaceIfNeeded() {
    return new Promise(function (resolve, reject) {
        client.execute(CREATE_KEY_SPACE_QUERY, null, { prepare: true }, function (err) {
            if (err) {
                cassandraHandlerLogContext.create_key_space_query_err = err;
                cassandraHandlerLogContext.create_key_space_query_inner_err = err.innerErrors;
                logger.error(cassandraHandlerLogContext, 'Cassandra handler: could not create keyspace');
                reject(err);
            } else {
                logger.info(cassandraHandlerLogContext, 'Cassandra handler: CREATE_KEY_SPACE_QUERY executed successfully!');
                resolve();
            }
        });
    });
}
