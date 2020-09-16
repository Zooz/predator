import React from 'react'
import style from './style.scss';
import classnames from 'classnames';

export default ({style: customStyle, children, className}) => {
    return (
        <div style={customStyle} className={classnames(style.wrapper, className)}>
            {children}
        </div>

    )
}
