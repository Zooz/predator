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
