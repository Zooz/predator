
import React from 'react';
import cronstrue from 'cronstrue';
import { getTimeFromCronExpr } from '../../instance/utils';
export default (props = {}) => {
  const { value } = props;
  const result = getTimeFromCronExpr(value);

  if (result) {
    return (
      <div style={{ width: '400px' }}>
        {cronstrue.toString(value)}
      </div>
    )
  }
  return null;
}
