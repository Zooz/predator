import React from 'react'
import style from './style.scss';
import classnames from 'classnames';

export default ({children,className})=>{
    return (
            <div className={classnames(style.wrapper,className)}>
                {children}
            </div>

    )
}