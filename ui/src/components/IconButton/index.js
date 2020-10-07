import React from 'react';
import Spinner from '../Spinner';
import css from './style.scss';
import TooltipWrapper from '../TooltipWrapper';

const IconButton = (props) => {
  const { className = '', inverted, disabled, width, spinner, height, onClick, style, children, title, ...rest } = props

  return (
    <TooltipWrapper
      content={<div>{title}</div>}
      place='top'
      dataId={`tooltipKey_${title}`}
      offset={{ top: 1 }}
      shouldShow={!disabled && !spinner}
    >
      {spinner
        ? <span className={css['spinner-span']} style={{ ...style, width, height }}>
          <Spinner className={css['icon']} inverted={inverted} />
        </span>
        : <div
          className={`${css['icon-button']} ${className}`}
          style={{ ...style, width, height }}
          data-disabled={disabled}
          onClick={(disabled || spinner) ? undefined : onClick}
          {...rest}
        >
          {children}
        </div>}
    </TooltipWrapper>
  )
}

export default IconButton;
