'use strict';

module.exports.dateXMonthAgo = (numberOfMonthBack) => {
    const date = new Date();
    date.setMonth(date.getMonth() - numberOfMonthBack);
    const result =
        {
            month: date.getUTCMonth() + 1,
            year: date.getUTCFullYear()
        };

    return result;
};
