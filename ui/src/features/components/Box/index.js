
import React from 'react';
import style from './style.scss';


const Box = ({title,value})=>{
    return (
        <div className={style['box-wrapper']}>
            <div className={style['box-title']}>
                <div className={style['box-label']}>{title}</div>
            </div>
            <div className={style['details']}>
                <div className={style['details-text']}>
                    {value}
                </div>
                <div></div>
            </div>
        </div>
    )

};

export default Box;