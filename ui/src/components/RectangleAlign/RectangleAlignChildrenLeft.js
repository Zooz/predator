import React from 'react';
import './RectangleAlignChildrenLeft.css';
import classnames from 'classnames';

const RactangleAlignChildrenLeft = (props) => {
    const {className, children, style} = props;
    return (
        <div style={style} className={classnames('rectangle-align-children-left', className)}>
            {children}
        </div>
    )
};

export default RactangleAlignChildrenLeft;
