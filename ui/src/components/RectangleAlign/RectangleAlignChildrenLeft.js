import React from 'react';
import './RectangleAlignChildrenLeft.css';
import classnames from 'classnames';

const RactangleAlignChildrenLeft = (props) => {
  const { className, children } = props;
  return (
    <div className={classnames('rectangle-align-children-left',className)}>
      {children}
    </div>
  )
};

export default RactangleAlignChildrenLeft;
