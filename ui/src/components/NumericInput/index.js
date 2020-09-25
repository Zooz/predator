import React, { Component } from 'react'
import PropTypes from 'prop-types'
import NumberFormat from 'react-number-format'
import classnames from 'classnames'
import Arrows from './components/Arrows'
import style from './NumericInput.scss'

export default class NumericInput extends Component {

  componentDidUpdate (prevProps, prevState) {

  }

    handleBlur = () => {
    }

    handleKeyDown = (event) => {
      if (event.key === 'Enter') {
      } else if (event.key === 'ArrowUp') {
        this.onUpPress()
        event.preventDefault()
      } else if (event.key === 'ArrowDown') {
        this.onDownPress()
        event.preventDefault()
      }
    }

    onUpPress = () => {
      const newValue = (this.props.value || 0) + 1
      if (this.isValid(newValue)) {
        this.props.onChange(newValue)
      }
    }

    onDownPress = () => {
      const newValue = (this.props.value || 0) - 1

      if (this.isValid(newValue)) {
        this.props.onChange(newValue)
      }
    }

    handleValueChange = ({ value }) => {
      if (this.isValid(value)) {
        this.props.onChange(value);
      }
    }

    isValid = (value) => {
      return !isNaN(value) && (value >= this.props.minValue) && (value <= this.props.maxValue)
    }

    isUpEnabled (value) {
      const { disabled } = this.props
      return !disabled && (value < this.props.maxValue)
    }

    isDownEnabled (value) {
      const { disabled } = this.props
      return !disabled && (value > this.props.minValue)
    }

    render () {
      const { value = 0 } = this.props
      const { disabled, hideNumber, width, height, formatter, error, className } = this.props

      return (
        <div
          style={{
            '--number-input-width': width,
            '--number-input-height': height
          }}
          data-error={error}
          data-disabled={disabled}
          className={classnames(style['input-counter-wrapper'], className)}
        >
          <NumberFormat
            disabled={disabled}
            className={style['input-counter']}
            onKeyDown={this.handleKeyDown}
            format={formatter}
            onBlur={this.handleBlur}
            value={hideNumber ? null : value}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (this.isValid(value)) {
                this.props.onChange(Number(value));
              } else {
                this.props.onChange(this.props.value);
              }
              event.preventDefault()
            }}
          />
          <Arrows
            disabled={disabled}
            onUpPress={this.props.onUpPress || this.onUpPress}
            onDownPress={this.props.onDownPress || this.onDownPress}
            isUpEnabled={this.isUpEnabled(value)}
            isDownEnabled={this.isDownEnabled(value)}
          />
        </div>
      )
    }
}

NumericInput.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  onUpPress: PropTypes.func,
  formatter: PropTypes.func,
  onDownPress: PropTypes.func,
  maxValue: PropTypes.number,
  minValue: PropTypes.number,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  hideNumber: PropTypes.bool,
  width: PropTypes.string,
  height: PropTypes.string,
  className: PropTypes.string
}

NumericInput.defaultProps = {
  minValue: 0,
  maxValue: Number.MAX_SAFE_INTEGER,
  disabled: false,
  hideNumber: false,
  error: false,
  width: '56px',
  height: '26px'
}
