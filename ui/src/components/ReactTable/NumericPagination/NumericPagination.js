import React, { Component } from 'react'
import PropTypes from 'prop-types'
import style from './NumericPagination.scss'
import NumericInput from '../../NumericInput'
import classnames from 'classnames'

const MIN_PAGE = 0

export default class NumericPagination extends Component {
  constructor (props) {
    super(props)
    this.state = {value: MIN_PAGE}
    if (this.isValid(props.value)) {
      this.state.value = Number(props.value)
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const {value} = this.props
    if (!!prevProps.value && prevProps.value !== value && prevState.value !== value) {
      if (!this.isValid(value)) {
        console.error(`page ${value} is not in range of ${this.mapFromZeroIndexed(MIN_PAGE)} to ${this.mapFromZeroIndexed(this.lastPageIndex)}`)
        return
      }
      this.updateValue(value)
    }
  }

  handleNumberChange = (pageNumber) => {
    const zeroIndexedPageNumber = this.mapToZeroIndexed(pageNumber)
    this.setState({value: zeroIndexedPageNumber})
    this.props.onPageChange(zeroIndexedPageNumber)
  }

  onNextPress = () => {
    if (!this.props.canNext) {
      return
    }
    const newValue = this.state.value + 1
    this.updateValue(newValue)
    this.props.onPageChange(newValue)
  }
  onPrevPress = () => {
    if (!this.props.canPrevious) {
      return
    }

    const newValue = this.state.value - 1
    this.updateValue(newValue)
    this.props.onPageChange(newValue)
  }

  get lastPageIndex () {
    return this.props.pages - 1
  }

  mapFromZeroIndexed = (value) => value + 1
  mapToZeroIndexed = (value) => value - 1

  isValid = (value) => {
    return !isNaN(value) && (value >= MIN_PAGE) && (value <= this.lastPageIndex)
  }
  updateValue = (newValue) => {
    this.setState({value: Number(newValue)})
  }

  render () {
    const {pages, previousText, nextText, canPrevious, canNext} = this.props
    const {value} = this.state

    return (
      <div className={style['wrapper']}>
        <div className={classnames(style['btn-text'], {[style['btn-enabled']]: canPrevious})}
          onMouseDown={this.onPrevPress}>
          {previousText}
        </div>
        <div className={style['wrapper']}>
          <span>Page</span>
          <div className={style['counter']}>
            <NumericInput // is Not zero indexed
              value={this.mapFromZeroIndexed(value)}
              onChange={this.handleNumberChange}
              minValue={this.mapFromZeroIndexed(MIN_PAGE)}
              maxValue={this.mapFromZeroIndexed(this.lastPageIndex)}
            />
          </div>
          <span>of {pages}</span>
        </div>
        <div
          className={classnames(style['btn-text'], {[style['btn-enabled']]: canNext})}
          onMouseDown={this.onNextPress}
        >
          {nextText}
        </div>
      </div>
    )
  }
}

NumericPagination.propTypes = {
  value: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  pages: PropTypes.number.isRequired,
  previousText: PropTypes.string,
  nextText: PropTypes.string,
  canNext: PropTypes.bool,
  canPrevious: PropTypes.bool
}

NumericPagination.defaultProps = {
  value: MIN_PAGE,
  previousText: 'Previous',
  nextText: 'Next'

}
