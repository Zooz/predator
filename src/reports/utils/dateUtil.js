'use strict';

module.exports.dateXMonthAgo = (numberOfMonthBack) => {
    const date = new Date();
    date.setMonth(date.getMonth() - numberOfMonthBack);
    return {
        month: date.getMonth() + 1,
        year: date.getFullYear()
    };
};
