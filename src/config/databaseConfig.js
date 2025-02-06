const config = {
    type: (process.env.DATABASE_TYPE || 'SQLITE').toUpperCase(),
    name: process.env.DATABASE_NAME || 'predator',
    address: process.env.DATABASE_ADDRESS,
    port: parseInt(process.env.DATABASE_PORT, 10) ?? 3306,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    sqliteStorage: process.env.SQLITE_STORAGE || 'predator.sqlite'
};

module.exports = config;
