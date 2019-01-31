'use strict';

let config = {
    type: process.env.DATABASE_TYPE || 'SQLITE',
    name: process.env.DATABASE_NAME,
    address: process.env.DATABASE_ADDRESS,
    cassandraReplicationFactor: process.env.CASSANDRA_REPLICATION_FACTOR || 1,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    sqlite_storage: process.env.SQLITE_STORAGE
};

module.exports = config;