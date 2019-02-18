import React from 'react'

import style from './style.scss';

export default (props) => {
  const { children } = props;
  return (
    <div className={style['modal']}>
      <div className={style['modal-content']}>
        {children}
      </div>
    </div>
  )
};
