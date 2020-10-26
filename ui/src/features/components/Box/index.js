
import React from 'react';
import style from './style.scss';

const Box = ({ title, value, rightComponent }) => {
  return (
    <div style={{ paddingBottom: rightComponent ? '0px' : undefined }} className={style['box-wrapper']}>
      <div className={style['box-title']}>
        <div className={style['box-label']}>{title}</div>
      </div>
      <div className={style['details']}>
        <div className={style['details-text']}>
          {value}
        </div>
        {rightComponent}
      </div>
    </div>
  )
};

export default Box;
