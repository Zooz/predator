import React, { Fragment } from 'react';
import Spinner from '../Spinner';
import css from './style.scss';

const IconButton = (props) => {
  const { className = '', inverted, disabled, width, spinner, height, color, onClick, style, ...rest } = props

  return (
    <Fragment>
      {spinner
        ? <span className={css['spinner-span']} style={{ ...style, width, height }}>
          <Spinner className={css['icon']} invertedPrimaryColor='#406eff' invertedSecondaryColor='#d9e2ff' inverted={inverted} size={'32px'} thickness={'3px'} />
        </span>
        : <div
          className={`${css['icon-button']} ${className}`}
          style={{ ...style, width, height }}
          data-disabled={disabled}
          onClick={(disabled || spinner) ? undefined : onClick}
          {...rest}
        >
          {rest.children}
        </div>}
    </Fragment>
  )
}

export default IconButton;
