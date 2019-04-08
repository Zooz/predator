const Sequelize = require('sequelize');

module.exports = {
    up: function (query, DataTypes) {
        return query.addColumn(
            'jobs', 'proxy_url',
            Sequelize.DataTypes.STRING).then(() => {
            return query.addColumn(
                'jobs', 'debug',
                Sequelize.DataTypes.STRING);
        });
    },
    down: function (query, DataTypes) {
        return query.sequelize.query([
            'ALTER TABLE "jobs" DROP COLUMN "proxy_ul";',
            'ALTER TABLE "jobs" DROP COLUMN "debug";'
        ].join(''), { raw: true });
    }
}
;