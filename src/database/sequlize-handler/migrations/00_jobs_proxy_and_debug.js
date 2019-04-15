const Sequelize = require('sequelize');

module.exports.up = async (query, DataTypes) => {
    await query.addColumn(
        'jobs', 'proxy_url',
        Sequelize.DataTypes.STRING);

    await query.addColumn(
        'jobs', 'debug',
        Sequelize.DataTypes.STRING);
};

module.exports.down = async (query, DataTypes) => {
    await query.sequelize.query([
        'ALTER TABLE "jobs" DROP COLUMN "proxy_ul";',
        'ALTER TABLE "jobs" DROP COLUMN "debug";'
    ].join(''), { raw: true });
};