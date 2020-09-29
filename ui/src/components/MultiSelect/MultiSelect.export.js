import React, { Component } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import classnames from 'classnames'
import style from './style/MultiSelect.scss'
import CheckboxGroup from './CheckboxGroup'
import FontAwesome from '../FontAwesome/FontAwesome.export'
import Chip from '../Chip/index'
import ErrorWrapper from '../ErrorWrapper/index'
import OptionItem from './OptionItem'
import { removeByAttribute, hasItems, areEquals, getFirstN } from '../Utils/Arrays'
import { setFocus } from '../Utils/DOMEvents'
import { startsWithStrategy } from '../Utils/FilteringStrategies.export'
import NoMatches from '../Dropdown/Components/NoMatches'
import Input from '../Dropdown/Components/Input'
import Filter from '../Dropdown/Components/Filter'
import ItemsWrapper from '../Dropdown/Components/ItemsWrapper'
import Placeholder from '../Dropdown/Components/Placeholder'
import ListWrapper from '../Dropdown/Components/ListWrapper'
import DynamicDropdown from '../Dropdown/Components/DynamicDropdown'

class MultiSelect extends Component {
  constructor (props) {
    super(props)
    const { options = [], selectedOptions = [] } = props

    this.state = {
      allOptions: options,
      shownOptions: [],
      selectedOptions: selectedOptions,
      isDropDownListOpen: false,
      filteringInputValue: '',
      isHovered: false,
      isOverflow: false
    }
  }

  // INIT
  componentDidUpdate (prevProps, prevState) {
    if (this.props.enableEllipsis && !this.state.isHovered) {
      const isOverflow =
        this.selectedOptionsInputElement &&
        this.selectedOptionsInputElement.clientHeight < this.selectedOptionsInputElement.scrollHeight
      if (prevState.isOverflow !== isOverflow) {
        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ isOverflow })
      }
    }
  }

  static getDerivedStateFromProps = (props, state) => {
    const newState = {}

    const areOptionsEqual = (options1 = [], options2 = []) => {
      return areEquals(options1.map((o) => _.get(o, 'key')), options2.map((o) => _.get(o, 'key')))
    }

    // Options
    if (!areOptionsEqual(props.options, state.allOptions)) {
      newState.allOptions = props.options
    }

    // Selected Options
    if (props.selectedOptions !== undefined && !areOptionsEqual(state.selectedOptions, props.selectedOptions)) {
      newState.selectedOptions = props.selectedOptions
    }

    // Filtering
    let shownOptions = []
    if (state.filteringInputValue.length === 0) {
      shownOptions = props.options
    } else {
      const filteredOptions = props.filteringStrategy({
        array: props.options,
        propName: 'value',
        value: state.filteringInputValue
      })
      shownOptions = filteredOptions || []
    }
    if (!areOptionsEqual(state.shownOptions, shownOptions)) {
      newState.shownOptions = shownOptions
    }

    return Object.keys(newState).length > 0 ? newState : null
  }

  // Selected-Options-Input Methods
  removeItemFromSelectedOptionsInput = item => {
    const { state, props } = this

    const selectedOptions = removeByAttribute(state.selectedOptions, 'value', _.get(item, 'value'))

    this.setState({ selectedOptions })
    props.onChange(selectedOptions)
  }

  // Options-List Methods
  handleOptionListOpen = () => {
    this.setState({
      isDropDownListOpen: true,
      shownOptions: this.state.allOptions
    })

    setFocus(this.filteringInput)
  }

  handleOptionListClose = () => {
    this.setState({ isDropDownListOpen: false })
  }

  // Filtering-Input Methods
  handleFilteringInputKeyPress = event => {
    const { allOptions, shownOptions, selectedOptions = [] } = this.state

    if (event.key.toLowerCase() === 'enter' && shownOptions.length === 1 && !selectedOptions.includes(shownOptions[0])) {
      selectedOptions.push(shownOptions[0])
      this.setState({
        shownOptions: allOptions,
        selectedOptions,
        filteringInputValue: ''
      })
      this.props.onChange(selectedOptions)
    }
  }

  handleFilteringInputKeyDown = event => {
    const { isDropDownListOpen } = this.state
    const ESCAPE = 27

    if (event.keyCode === ESCAPE && isDropDownListOpen) {
      this.handleOptionListClose()
    }
  }

  // Options Methods
  handleSelectAllOptionChange = checked => {
    const selectedOptions = checked ? [...this.state.allOptions] : []
    this.setState({
      selectedOptions: selectedOptions
    })
    this.props.onChange(selectedOptions)
  }

  handleOptionsSelectionChange = selectedOptionsKeys => {
    const selectedOptions = this.state.allOptions.filter((option) => selectedOptionsKeys.includes(_.get(option, 'key')))

    this.setState({
      selectedOptions
    })

    this.props.onChange(selectedOptions)
    setFocus(this.filteringInput)
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
    const {
      selectedOptions, shownOptions, isDropDownListOpen,
      isHovered, isOverflow
    } = this.state
    const checkAll = this.state.selectedOptions.length === this.state.allOptions.length

    const {
      validationErrorText, enableSelectAll, enableEllipsis, selectAllText,
      maxSize, enableFilter, placeholder, disabled, height
    } = this.props

    let isInputOpen
    let isOverflowing = false
    if (enableEllipsis) {
      if (isHovered && !isDropDownListOpen && isOverflow) {
        isInputOpen = true
        isOverflowing = true
      } else {
        isInputOpen = isDropDownListOpen
      }
    } else {
      isOverflowing = true
      isInputOpen = isDropDownListOpen
    }

    const componentWrapperClassName = classnames(style.wrapper, { [style.ellipsis]: enableEllipsis })

    const SelectedOptionsInputItems = ({ disabled }) =>
      <div>
        {selectedOptions.map((option, index) => (
          <Chip
            disabled={disabled}
            data-test='selected-option'
            className={style['input-item']}
            key={_.get(option, 'value') + index}
            onRemove={() => this.removeItemFromSelectedOptionsInput(option)}
          >
            {_.get(option, 'value')}
          </Chip>
        ))}
      </div>

    const buildOptionsListItems = () => {
      const options = getFirstN([...shownOptions], maxSize)
      return options.map((option) => ({
        value: _.get(option, 'value'),
        key: _.get(option, 'key')
      }))
    }

    const inputComponent = (
      <ErrorWrapper errorText={validationErrorText}>
        <Input
          disabled={disabled}
          isOverflow={isOverflowing}
          isOpen={isInputOpen}
          onMouseEnter={() => enableEllipsis && this.setState({ isHovered: true })}
          onMouseLeave={() => enableEllipsis && this.setState({ isHovered: false })}
          onKeyDown={this.handleInputKeyDown}
          ref={input => { this.selectedOptionsInputElement = input }}
          height={height}
          onClick={this.handleOptionListOpen}
        >
          <>
            {hasItems(selectedOptions)
              ? <SelectedOptionsInputItems disabled={disabled} />
              : <Placeholder>{placeholder}</Placeholder>}
            {(enableEllipsis && !isDropDownListOpen && !isHovered && isOverflow) &&
              /* Ellipsis Icon */
              <FontAwesome icon='commenting-o' className={style['overflow-icon']} />}
          </>
        </Input>
      </ErrorWrapper>
    )

    const listOptionsComponent = (
      <ListWrapper>

        {/* filter */}
        {enableFilter &&
          <Filter
            ref={input => { this.filteringInput = input }}
            value={this.state.filteringInputValue}
            onChange={(event) => this.setState({ filteringInputValue: event.target.value })}
            onKeyPress={this.handleFilteringInputKeyPress}
            onKeyDown={this.handleFilteringInputKeyDown}
          />}

        {/* Options */}
        <ItemsWrapper>
          {enableSelectAll && (
            <OptionItem
              data-test='select-all-checkbox'
              indeterminate={hasItems(selectedOptions) && !checkAll}
              onChange={this.handleSelectAllOptionChange}
              checked={checkAll}
            >
              {selectAllText}
            </OptionItem>
          )}
          <CheckboxGroup
            data-test='options'
            options={buildOptionsListItems()}
            checkedOptions={selectedOptions.map((option) => _.get(option, 'key'))}
            onChange={this.handleOptionsSelectionChange}
          />
          {
            shownOptions.length === 0 &&
              <NoMatches />
          }
        </ItemsWrapper>
      </ListWrapper>
    )

    return (
      <div
        data-disabled={String(disabled)}
        className={componentWrapperClassName}
        style={{ '--multiple-select-height': height }}
      >
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

MultiSelect.propTypes = {
  // Data
  options: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.any, value: PropTypes.any })).isRequired,
  selectedOptions: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.any, value: PropTypes.any })),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  height: PropTypes.string,
  disabled: PropTypes.bool,
  maxSize: PropTypes.number,
  validationErrorText: PropTypes.string,
  // Filter
  enableFilter: PropTypes.bool,
  filteringStrategy: PropTypes.func,
  // Select All
  enableSelectAll: PropTypes.bool,
  selectAllText: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  // Ellipsis
  enableEllipsis: PropTypes.bool
}

MultiSelect.defaultProps = {
  // Data
  options: [],
  selectedOptions: [],
  onChange: _.noop,
  placeholder: 'Please Select',
  height: '35px',
  disabled: false,
  maxSize: 500,
  validationErrorText: '',
  // Filter
  enableFilter: true,
  filteringStrategy: startsWithStrategy,
  // Select All
  enableSelectAll: false,
  selectAllText: 'Select All',
  // Ellipsis
  enableEllipsis: false
}

export default MultiSelect
