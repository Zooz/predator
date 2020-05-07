import React, { Component } from 'react'
import PropTypes from 'prop-types'
import style from './Checkbox.scss'
import FontAwesome from '../FontAwesome/FontAwesome.export'
import classnames from 'classnames'

class Checkbox extends Component {
  render () {
    const { disabled, checked, indeterminate } = this.props
    const icon = this.getIcon()
    return (
      <div
        data-checked={checked}
        className={classnames(icon ? style['checkbox--checked'] : style['checkbox--unchecked'], style.checkbox, { [style.disabled]: disabled })}
      >
        {icon && <FontAwesome className={style.icon} icon={icon} />}
        <input disabled={disabled} checked={checked || indeterminate} type='checkbox' onChange={this.handleOnChange} />
      </div>
    )
  }

  handleOnChange = (e) => {
    e.stopPropagation()
    const { onChange, disabled, checked } = this.props
    if (onChange && !disabled) {
      onChange(!checked)
    }
  }

  getIcon = () => {
    const { indeterminate, checked } = this.props
    if (indeterminate) {
      return 'minus'
    }
    return checked && 'check'
  }
}

Checkbox.propTypes = {
  indeterminate: PropTypes.bool,
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func
}
Checkbox.defaultProps = {
  indeterminate: false,
  checked: false,
  disabled: false
}

export default Checkbox
