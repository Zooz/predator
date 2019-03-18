let cassandra = require('cassandra-driver');
const config = {
    type: process.env.DATABASE_TYPE || 'SQLITE',
    name: process.env.DATABASE_NAME || 'predator',
    address: process.env.DATABASE_ADDRESS,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    cassandraReplicationFactor: process.env.CASSANDRA_REPLICATION_FACTOR || 1,
    cassandraConsistency: process.env.CASSANDRA_CONSISTENCY || cassandra.types.consistencies.localQuorum,
    cassandraKeyspaceStrategy: process.env.CASSANDRA_KEY_SPACE_STRATEGY || 'SimpleStrategy',
    cassandraLocalDataCenter: process.env.CASSANDRA_LOCAL_DATA_CENTER,
    sqliteStorage: process.env.SQLITE_STORAGE || 'predator'
};

module.exports = config;