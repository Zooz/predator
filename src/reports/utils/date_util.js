'use strict';

module.exports.dateXMonthAgo = (numberOfMonthBack) => {
    const date = new Date();
    date.setMonth(date.getMonth() - numberOfMonthBack);
    const result =
        {
            month: date.getMonth() + 1,
            year: date.getFullYear()
        };

    return result;
};
