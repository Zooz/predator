import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import OptionItem from '../OptionItem'
import { removeItem, addItem } from '../../Utils/Arrays'

class CheckboxGroup extends Component {
  constructor (props) {
    super(props)
    this.state = {
      checkedOptions: this.props.checkedOptions.map((option) => _.get(option, 'key')) || []
    }
  }

  static getDerivedStateFromProps (props) {
    return props.checkedOptions ? { checkedOptions: props.checkedOptions } : null
  }

  onCheckBoxItemCheck = optionKey => {
    const { checkedOptions } = this.state
    const isChecked = checkedOptions.includes(optionKey)

    const currentCheckedOptions = isChecked
      ? removeItem(checkedOptions, optionKey)
      : addItem(checkedOptions, optionKey).sort()

    this.setState({ checkedOptions: currentCheckedOptions })

    this.props.onChange(currentCheckedOptions)
  }

  render () {
    const { checkedOptions } = this.state
    const { options, className, checkedOptions: checkedOptionsFromProps, ...rest } = this.props

    const buildCheckBoxItems = () => {
      return options.map((option, i) => {
        const key = _.get(option, 'key')
        return (
          <OptionItem
            data-test='option'
            key={`${i}_${key}`}
            checked={checkedOptions.includes(key)}
            onChange={() => this.onCheckBoxItemCheck(key)}
          >
            {option.value}
          </OptionItem>
        )
      })
    }

    return (
      <div data-test='checkbox-group' className={className} {...rest}>
        {buildCheckBoxItems()}
      </div>
    )
  }
}

CheckboxGroup.propTypes = {
  className: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.any).isRequired,
  checkedOptions: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired
}

CheckboxGroup.defaultProps = {
  options: [],
  checkedOptions: [],
  onChange: _.noop
}

export default CheckboxGroup
