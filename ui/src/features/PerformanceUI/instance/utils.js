import { SearchField } from 'react-bootstrap-table';
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

export const createCustomSearchField = (props) => {
  return (
    <SearchField style={{ width: '40%', float: 'right' }}
      defaultValue={props.defaultSearch}
      placeholder={props.searchPlaceholder} />
  );
};

export const getTimeFromCronExpr = (cronValue) => {
  let result;
  try {
    result = cronstrue.toString(cronValue)
  } catch (err) {
  }
  return result || ''
};



function quantify(data, unit, value, allowZero) {
  if (value || (allowZero && !value)) {
    // if (value > 1 || value < -1 || value === 0)
    //   unit += 's'

    data.push(value + ' ' + unit)
  }

  return data
}

export const prettySeconds =(seconds)=> {

  var prettyString = '',
      data = []

  if (typeof seconds === 'number') {

    function fix10(number) {
      return number.toFixed(10)
    }

    data = quantify(data, 'd',    parseInt(fix10(seconds / 86400)))
    data = quantify(data, 'h',   parseInt(fix10((seconds % 86400) / 3600)))
    data = quantify(data, 'm', parseInt(fix10((seconds % 3600) / 60)))
    data = quantify(data, 's', Math.floor(seconds % 60), data.length < 1)

    var length = data.length,
        i;

    for (i = 0; i < length; i++) {

      if (prettyString.length > 0)
        if (i == length - 1)
          prettyString += ' and '
        else
          prettyString += ', '

      prettyString += data[i]
    }
  }

  return prettyString
}
