'use strict';

const _ = require('lodash'),
    uuid = require('uuid/v4');

module.exports.getLastMonthDate = async (numberOfMonthBack) => {
    Array(numberOfMonthBack).map((_, x) => {

    });
};

function dateMonthAgo(numberOfMonthBack) {
    const date = new Date();
    date.setMonth(date.getMonth() - numberOfMonthBack);
    const result:
        {
            month: date.getUTCMonth() + 1,
            year: date.getUTCFullYear()


        };

    return result;

}
