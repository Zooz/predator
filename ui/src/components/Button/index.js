import React, { Fragment } from 'react'
import PropTypes from 'prop-types'

// import Spinner from '../Spinner'
import css from './index.scss'

const Button = (props = {}) => {
  const { className = '', inverted, hover, disabled, width,spinner, height, borderWidth, color, onClick, style, icon, ...rest } = props

  let buttonStyle = { borderWidth, height, width, ...style }
  if (color && inverted) {
    Object.assign(buttonStyle, {
      borderColor: color,
      color: color
    })
  } else if (color && !inverted) {
    Object.assign(buttonStyle, {
      borderColor: color,
      backgroundColor: color
    })
  }

  return (
    <button
      style={buttonStyle}
      {...rest}
      className={`${css['button']} ${className}`}
      data-icon={!!icon}
      data-inverted={String(inverted)}
      disabled={disabled}
      data-hover={String(hover)}
      // data-spinner={String(spinner)}
      onClick={(disabled || spinner) ? undefined : onClick}
    >
      {renderContent(props)}
    </button>
  )
}

const renderContent = ({ icon, spinner, inverted, children }) => {
  return (<Fragment>
    <span data-spinner={String(spinner)} className={css['button__inner']}>
      {renderIcon({ icon })}
      {spinner
        ? (<span className={css['button-spinner']}>
          {/*<Spinner inverted={inverted} />*/}
        </span>)
        : null}
      {renderChildren({ children })}
    </span>
  </Fragment>)
}
const renderIcon = ({ icon }) => icon ? (<i className={`fa ${css.icon} ${icon}`} />) : null

const renderChildren = ({ children }) => children && (<span className={css.button__text}>{children}</span>)

Button.propTypes = {
  className: PropTypes.string,
  onClick: PropTypes.func,
  inverted: PropTypes.bool,
  hover: PropTypes.bool,
  icon: PropTypes.string,
  spinner: PropTypes.bool,
  disabled: PropTypes.bool,
  children: PropTypes.string,
  width: PropTypes.string,
  height: PropTypes.string,
  color: PropTypes.string
}

Button.defaultProps = {
  className: '',
  inverted: false,
  hover: true,
  icon: undefined,
  spinner: false,
  disabled: false,
  children: undefined
}

export default Button
