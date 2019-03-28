/* eslint-env jest */

import React from 'react'
import { shallow } from 'enzyme'
import NumericPagination from '../NumericPagination.js'
import NumericInput from '../../../NumericInput'

describe('<NumericPagination />', () => {
  let props
  const renderComponent = (props) => {
    return shallow(<NumericPagination {...props} />)
  }
  const PAGES = 10
  const MAX = 9
  const MIN = 0

  beforeEach(() => {
    props = {
      value: 3,
      onPageChange: jest.fn(),
      pages: PAGES,
      canNext: true,
      canPrevious: true
    }
  })

  describe('When value is in range ', function () {
    it('should render the Prev Btn as enabled and Next Btn as enabled', function () {
      const wrapper = renderComponent(props)
      expect(wrapper.find('.btn-text').at(0).hasClass('btn-enabled')).toEqual(true)
      expect(wrapper.find('.btn-text').at(1).hasClass('btn-enabled')).toEqual(true)
    })
  })
  describe('When is minimal cant go any Previous ', function () {
    it('should render the Prev Btn as disabled and Next Btn as enabled', function () {
      props.canPrevious = false
      const wrapper = renderComponent(props)
      expect(wrapper.find('.btn-text').at(0).hasClass('btn-enabled')).toEqual(false)
      expect(wrapper.find('.btn-text').at(1).hasClass('btn-enabled')).toEqual(true)
    })
  })
  describe('When value is maximal and cant do next', function () {
    it('should render the Prev Btn as enabled and Next Btn as disabled', function () {
      props.canNext = false
      const wrapper = renderComponent(props)
      expect(wrapper.find('.btn-text').at(0).hasClass('btn-enabled')).toEqual(true)
      expect(wrapper.find('.btn-text').at(1).hasClass('btn-enabled')).toEqual(false)
    })
  })
  describe('When value is under range ', function () {
    describe('on create instance ', function () {
      it('should set the default value', function () {
        props.value = -1
        const wrapper = renderComponent(props)
        expect(wrapper.state().value).toEqual(MIN)
      })
    })
    describe('on update props', function () {
      it('should set the last value', function () {
        props.value = 2
        const wrapper = renderComponent(props)
        wrapper.setProps({value: -1})
        expect(wrapper.state().value).toEqual(2)
      })
    })
  })

  describe('When pressing Next ', function () {
    describe('new value is still in range ', function () {
      it('should increase state.value and call onPageChange()', function () {
        props.canNext = true
        props.value = 2
        const wrapper = renderComponent(props)
        wrapper.instance().onNextPress()

        expect(wrapper.state().value).toEqual(props.value + 1)
        expect(props.onPageChange.mock.calls[0]).toEqual([props.value + 1])
      })
    })
    describe('new value exceeds range ', function () {
      it('should keep state.value as current value and  not call onPageChange()', function () {
        props.canNext = false
        props.value = MAX
        const wrapper = renderComponent(props)

        wrapper.instance().onNextPress()

        expect(wrapper.state().value).toEqual(props.value)
        expect(props.onPageChange.mock.calls.length).toEqual(0)
      })
    })
  })
  describe('When pressing Prev ', function () {
    describe('new value is still in range ', function () {
      it('should increase state.value and call onPageChange()', function () {
        props.value = MAX
        props.canPrevious = true
        const expectedPage = props.value - 1

        const wrapper = renderComponent(props)
        wrapper.instance().onPrevPress()

        expect(wrapper.state().value).toEqual(expectedPage)
        expect(props.onPageChange.mock.calls.length).toEqual(1)
        expect(props.onPageChange.mock.calls[0]).toEqual([expectedPage])
      })
    })
    describe('new value exceeds range ', function () {
      it('should keep state.value as current value and  not call onPageChange()', function () {
        props.canPrevious = false
        props.value = MIN

        const wrapper = renderComponent(props)

        wrapper.instance().onPrevPress()

        expect(wrapper.state().value).toEqual(props.value)
        expect(props.onPageChange.mock.calls.length).toEqual(0)
      })
    })
  })

  describe('When getting pageNumber from NumericInput', function () {
    it('maps it to zero indexed and calls onPageChange', function () {
      const wrapper = renderComponent(props)
      const nonZeroIndexedNumber = 3
      wrapper.instance().handleNumberChange(nonZeroIndexedNumber)

      expect(props.onPageChange.mock.calls[0]).toEqual([nonZeroIndexedNumber - 1])
    })
  })

  describe('Always', function () {
    it('maps props to non zero indexed', function () {
      const wrapper = renderComponent(props)

      expect(wrapper.find(NumericInput).props().value).toEqual(props.value + 1)
      expect(wrapper.find(NumericInput).props().minValue).toEqual(MIN + 1)
      expect(wrapper.find(NumericInput).props().maxValue).toEqual(props.pages)
    })
  })
})
