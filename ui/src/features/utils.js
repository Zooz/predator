import React from 'react';
import cronstrue from 'cronstrue';

export const sortDates = (a, b, order) => {
  let dateA = new Date(a.updated_at);
  let dateB = new Date(b.updated_at);
  if (order === 'desc') {
    return dateB.getTime() - dateA.getTime();
  } else {
    return dateA.getTime() - dateB.getTime();
  }
};

export const getTimeFromCronExpr = (cronValue) => {
  let result;
  try {
    result = cronstrue.toString(cronValue)
  } catch (err) {
  }
  return result || ''
};

function quantify (data, unit, value, allowZero) {
  if (value || (allowZero && !value)) {
    // if (value > 1 || value < -1 || value === 0)
    //   unit += 's'

    data.push(value + ' ' + unit)
  }

  return data
}
const mappedStatuses = {
  intermediate: 'In Progress',
  in_progress: 'In Progress',
  first_intermediate: 'In Progress'
}

export const prettierStatus = (status) => {
  const mappedStatus = mappedStatuses[status] || status;
  return (mappedStatus.charAt(0).toUpperCase() + mappedStatus.slice(1)).split('_').join(' ');
}
export const prettySeconds = (seconds) => {
  function fix10 (number) {
    return number.toFixed(10)
  }
  var prettyString = '';
  var data = []

  if (typeof seconds === 'number') {
    data = quantify(data, 'd', parseInt(fix10(seconds / 86400)))
    data = quantify(data, 'h', parseInt(fix10((seconds % 86400) / 3600)))
    data = quantify(data, 'm', parseInt(fix10((seconds % 3600) / 60)))
    data = quantify(data, 's', Math.floor(seconds % 60), data.length < 1)

    var length = data.length;
    var i;

    for (i = 0; i < length; i++) {
      if (prettyString.length > 0) {
        if (i == length - 1) { prettyString += ' and ' } else { prettyString += ', ' }
      }

      prettyString += data[i]
    }
  }

  return prettyString
}
