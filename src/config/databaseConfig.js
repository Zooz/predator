let cassandra = require('cassandra-driver');
const config = {
    type: (process.env.DATABASE_TYPE || 'SQLITE').toUpperCase(),
    name: process.env.DATABASE_NAME || 'predator',
    address: process.env.DATABASE_ADDRESS,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    cassandraReplicationFactor: process.env.CASSANDRA_REPLICATION_FACTOR || 1,
    cassandraConsistency: getCassandraConsistencyByName(process.env.CASSANDRA_CONSISTENCY),
    cassandraKeyspaceStrategy: process.env.CASSANDRA_KEY_SPACE_STRATEGY || 'SimpleStrategy',
    cassandraLocalDataCenter: process.env.CASSANDRA_LOCAL_DATA_CENTER,
    sqliteStorage: process.env.SQLITE_STORAGE || 'predator'
};

function getCassandraConsistencyByName(cassandraConsistencyName) {
    let consistency = cassandra.types.consistencies[cassandraConsistencyName];
    if (!consistency) {
        consistency = cassandra.types.consistencies.localQuorum;
    }
    return consistency;
}

module.exports = config;