import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import ErrorWrapper from '../ErrorWrapper'
import style from './style/Dropdown.scss'
import { setFocus } from './Components/Utils/DOMEvents'
import { startsWithStrategy } from './Components/Utils/FilteringStrategies.export'
import SelectedText from './Components/SelectedText'
import ItemsList from './Components/ItemsList'
import NoMatches from './Components/NoMatches'
import Input from './Components/Input'
import Filter from './Components/Filter'
import Placeholder from './Components/Placeholder'
import ListWrapper from './Components/ListWrapper'
import DynamicDropdown from './Components/DynamicDropdown'

class Dropdown extends Component {
  constructor (props) {
    super(props)

    this.state = {
      isDropDownListOpen: false,
      filteringInputValue: '',
      shownOptions: []
    }
  }

  // Options-List Methods
  handleOptionListOpen = () => {
    this.setState({
      isDropDownListOpen: true
    })

    setFocus(this.filteringInput)
  }

  handleOptionListClose = () => {
    this.setState({ isDropDownListOpen: false })
  }

  static getDerivedStateFromProps = (props, state) => {
    const newState = {}

    const options = _.uniqBy(props.options, (option) => _.get(option, 'key'))

    // Filtering
    let shownOptions = []
    if (state.filteringInputValue.length === 0) {
      shownOptions = options
    } else {
      const filteredOptions = props.filteringStrategy({
        array: options,
        propName: 'value',
        value: state.filteringInputValue
      })
      shownOptions = filteredOptions || []
    }
    newState.shownOptions = shownOptions

    return Object.keys(newState).length > 0 ? newState : null
  }

  // Filtering-Input Methods
  handleFilteringInputKeyPress = event => {
    const { shownOptions } = this.state
    const { selectedOption = {} } = this.props

    if (
      event.key.toLowerCase() === 'enter' &&
      shownOptions.length === 1 &&
      selectedOption.value !== shownOptions[0]
    ) {
      this.setState({
        filteringInputValue: ''
      })
      this.handleOptionListClose()
      this.props.onChange(shownOptions[0])
    }
  }

  handleFilteringInputKeyDown = event => {
    const { isDropDownListOpen } = this.state
    const ESCAPE = 27

    if (event.keyCode === ESCAPE && isDropDownListOpen) {
      this.handleOptionListClose()
    }
  }

  handleItemSelect = (value) => {
    this.props.onChange(value)
    this.handleOptionListClose()
  }

  handleInputKeyDown = (event) => {
    const SPACEBAR = 32
    if (event.keyCode === SPACEBAR && !this.state.isDropDownListOpen) {
      event.preventDefault()
      this.handleOptionListOpen()
    }
  }

  // RENDERING
  render () {
    const { isDropDownListOpen, shownOptions } = this.state
    const {
      validationErrorText,
      enableFilter,
      placeholder,
      disabled,
      height,
      selectedOption
    } = this.props

    const inputComponent = (
      <ErrorWrapper errorText={validationErrorText}>
        <Input
          disabled={disabled}
          isOpen={isDropDownListOpen}
          height={height}
          onKeyDown={this.handleInputKeyDown}
          onClick={this.handleOptionListOpen}
        >
          {!selectedOption || !selectedOption.value
            ? <Placeholder>{placeholder}</Placeholder>
            : (
              <SelectedText>
                {selectedOption.value}
              </SelectedText>
            )}
        </Input>
      </ErrorWrapper>
    )
    const listOptionsComponent = (
      <ListWrapper>
        {/* filter */}
        {enableFilter && (
          <Filter
            ref={input => { this.filteringInput = input }}
            value={this.state.filteringInputValue}
            onChange={(event) => this.setState({ filteringInputValue: event.target.value })}
            onKeyPress={this.handleFilteringInputKeyPress}
            onKeyDown={this.handleFilteringInputKeyDown}
          />
        )}

        {/* Options */}
        <ItemsList onClick={this.handleItemSelect} items={shownOptions} />
        {shownOptions.length === 0 && <NoMatches />}
      </ListWrapper>
    )
    return (
      <div data-disabled={String(disabled)} className={style.wrapper}>
        <DynamicDropdown
          inputComponent={inputComponent}
          listOptionsComponent={listOptionsComponent}
          isListOpen={isDropDownListOpen}
          onListClose={this.handleOptionListClose}
        />
      </div>
    )
  }
}

Dropdown.propTypes = {
  // Data
  options: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.any,
    value: PropTypes.any,
    disabled: PropTypes.bool
  })).isRequired,
  selectedOption: PropTypes.shape({ key: PropTypes.any, value: PropTypes.string }),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  height: PropTypes.string,
  disabled: PropTypes.bool,
  validationErrorText: PropTypes.string,
  // Filter
  enableFilter: PropTypes.bool,
  filteringStrategy: PropTypes.func
}

Dropdown.defaultProps = {
  // Data
  options: [],
  selectedOption: undefined,
  onChange: _.noop,
  placeholder: 'Please Select',
  height: '35px',
  disabled: false,
  validationErrorText: '',
  // Filter
  enableFilter: true,
  filteringStrategy: startsWithStrategy
}

export default Dropdown
