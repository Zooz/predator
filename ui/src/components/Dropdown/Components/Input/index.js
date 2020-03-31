import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import style from './Input.scss'
import Arrow from '../Arrow'

const Input = React.forwardRef(({ children, error, disabled, isOpen, onClick, height, isOverflow, ...rest }, ref) => {
  return (
    <div
      {...rest}
      ref={ref}
      onClick={onClick}
      tabIndex='0'
      data-test='selected-options-input'
      style={{
        '--height': height
      }}
      className={classnames(style.input, {
        [style['input--error']]: error,
        [style['input--closed']]: !isOpen,
        [style['input--open']]: isOpen,
        [style['input--overflowed']]: isOverflow,
        [style['input--disabled']]: disabled
      })}
    >
      {children}
      <Arrow disabled={disabled} />
    </div>
  )
})

Input.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  height: PropTypes.string.isRequired,
  error: PropTypes.bool,
  isOpen: PropTypes.bool,
  isShadow: PropTypes.bool,
  isOverflow: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func
}

export default Input
