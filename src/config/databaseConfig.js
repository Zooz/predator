const config = {
    type: (process.env.DATABASE_TYPE || 'SQLITE').toUpperCase(),
    name: process.env.DATABASE_NAME || 'predator',
    address: process.env.DATABASE_ADDRESS,
    // Left undefined on purpose when unset, so Sequelize applies the dialect's own default
    // (5432 postgres, 1433 mssql, 3306 mysql). Hardcoding 3306 broke every non-MySQL dialect.
    port: parseInt(process.env.DATABASE_PORT, 10) || undefined,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    sqliteStorage: process.env.SQLITE_STORAGE || 'predator.sqlite'
};

module.exports = config;
