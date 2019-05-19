import React, { Component } from 'react'
import PropTypes from 'prop-types'
import style from './style/MultiValueInput.scss'
import classnames from 'classnames'

import Chip from '../Chip'
import { map } from 'lodash'

const hasItems = array => !!(array && array.length)

class MultiValueInput extends Component {
  constructor (props) {
    super(props)
    this.state = { value: '' }
  }

  isValidValue = value => !!value && !map(this.props.values, 'value').includes(value)

  handleKeyDown = event => {
    const { value } = this.state
    const fixedValue = value.trim()
    const { values, fixedInputLength, onAddItem, onRemoveItem, submitKeys, minimumChars } = this.props
    const isAtRequiredChars = fixedInputLength ? (fixedValue.length === fixedInputLength) : minimumChars ? (fixedValue.length >= minimumChars) : true
    const addOperationCalled = submitKeys.includes(event.key)
    const shouldAddItem = addOperationCalled && this.isValidValue(fixedValue) && isAtRequiredChars
    const shouldRemoveItem = !value && hasItems(values) && event.key === 'Backspace'
    if (shouldAddItem) {
      onAddItem(fixedValue)
      this.setState({ value: '' })
    }
    if (shouldRemoveItem) {
      const lastValue = values.pop()
      onRemoveItem(lastValue.value)
      this.setState({ value: lastValue.value.substring(0, lastValue.value.length) })
    }
  }

  handleOnChange = event => {
    const { value } = event.target
    const { fixedInputLength, autoAddValues, onAddItem, validationFunc } = this.props
    const shouldAddItem = autoAddValues ? fixedInputLength === value.length : false
    const shouldChange = fixedInputLength ? fixedInputLength >= value.length : true
    if (shouldAddItem) {
      if (this.isValidValue(value)) {
        this.setState({ value: '' }, () => onAddItem(value))
      }
    } else if (shouldChange) {
      if (validationFunc(value) || value === '') {
        this.setState({ value })
      }
    }
  }

  render () {
    const { values, placeholder, onRemoveItem, className, submitKeys, disabled } = this.props
    const { value } = this.state
    const showPlaceholder = !hasItems(values) && !value.length
    return (
      <div disable={String(disabled)} className={classnames(className, style['wrapper'])}>
        {showPlaceholder && <div className={style['placeholder']}>{placeholder}</div>}
        {values.map(({ label, value }) => <Chip key={value}
          className={style['list-item']}
          onRemove={onRemoveItem.bind(null, value)} >
          {label}
        </Chip>
        )}
        <input
          className={style['input-field']}
          value={value}
          onChange={this.handleOnChange}
          onKeyDown={this.handleKeyDown}
          onBlur={() => this.handleKeyDown({ key: submitKeys[0] })}
        />
      </div>
    )
  }
}

MultiValueInput.propTypes = {
  values: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  })),
  placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onAddItem: PropTypes.func,
  onRemoveItem: PropTypes.func,
  className: PropTypes.string,
  fixedInputLength: PropTypes.number,
  submitKeys: PropTypes.arrayOf(PropTypes.string),
  autoAddValues: PropTypes.bool,
  disabled: PropTypes.bool,
  minimumChars: PropTypes.number,
  validationFunc: PropTypes.func
}

MultiValueInput.defaultProps = {
  placeholder: 'Please enter',
  values: [],
  submitKeys: ['Enter'],
  autoAddValues: false,
  disabled: false,
  validationFunc: () => true
}

export default MultiValueInput
