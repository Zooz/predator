import React, { Component } from 'react'
import PropTypes from 'prop-types'
import css from './LabeledCheckbox.scss'
import Checkbox from '../Checkbox/Checkbox'
import classnames from 'classnames'

class LabeledCheckbox extends Component {
  render () {
    const { children, className, checkboxClassName, indeterminate, checked, disabled, onChange, ...rest } = this.props
    return (
      <span
        {...rest}
        className={classnames(className, css.wrapper, { [css.disabled]: disabled })}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span className={classnames(css.input_wrapper, checkboxClassName)}>
          <Checkbox
            indeterminate={indeterminate}
            checked={checked}
            disabled={disabled}
          />
        </span>
        <label className={css.label_wrapper}>
          {children}
        </label>
      </span>
    )
  }
}

LabeledCheckbox.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  className: PropTypes.string,
  indeterminate: PropTypes.bool,
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  checkboxClassName: PropTypes.string
}
LabeledCheckbox.defaultProps = {
  indeterminate: false,
  checked: false,
  disabled: false
}

export default LabeledCheckbox
