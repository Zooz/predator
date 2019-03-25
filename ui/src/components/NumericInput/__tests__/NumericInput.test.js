/* eslint-env jest */

import React from 'react'
import { mount } from 'enzyme'
import { NumericInput } from '../../index'
import Arrows from '../components/Arrows'

describe('<NumericInput />', () => {
  let props
  const renderComponent = (props) => {
    return mount(<NumericInput {...props} />)
  }
  const MAX = 10
  const MIN = 0

  let event

  beforeEach(() => {
    props = {
      value: 3,
      maxValue: MAX,
      minValue: MIN,
      onChange: jest.fn()
    }
    event = {
      target: {value: ''},
      preventDefault: jest.fn()
    }
  })

  describe('When value is in range ', function () {
    it('should render the Down Btn as enabled and Up Btn as enabled', function () {
      const wrapper = renderComponent(props)
      expect(wrapper.find(Arrows).props().isUpEnabled).toEqual(true)
      expect(wrapper.find(Arrows).props().isDownEnabled).toEqual(true)
    })
  })
  describe('When value is minimal ', function () {
    it('should render the Down Btn as disabled and Up Btn as enabled', function () {
      props.value = MIN
      const wrapper = renderComponent(props)

      expect(wrapper.find(Arrows).props().isDownEnabled).toEqual(false)
      expect(wrapper.find(Arrows).props().isUpEnabled).toEqual(true)
    })
  })
  describe('When value is maximal ', function () {
    it('should render the Down Btn as enabled and Up Btn as disabled', function () {
      props.value = MAX
      const wrapper = renderComponent(props)
      expect(wrapper.find(Arrows).props().isDownEnabled).toEqual(true)
      expect(wrapper.find(Arrows).props().isUpEnabled).toEqual(false)
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
    describe('on on update props', function () {
      it('should set the last value', function () {
        props.value = 2
        const wrapper = renderComponent(props)
        wrapper.setProps({value: -1})
        expect(wrapper.state().value).toEqual(2)
      })
    })
  })

  describe('When value is changed by textinput ', function () {
    describe('When value is in range ', function () {
      it('should set the value', function () {
        const wrapper = renderComponent(props)
        wrapper.instance().onValuesChangeInnerHandler({value: 2})
        expect(wrapper.state().value).toEqual(2)
      })
    })
    describe('When value is out of range ', function () {
      it('should keep the last value', function () {
        const wrapper = renderComponent(props)
        event.target.value = 22
        wrapper.instance().onChangeInnerHandler(event)
        expect(wrapper.state().value).toEqual(props.value)
      })
    })
  })

  describe('When pressing Up ', function () {
    describe('new value is still in range ', function () {
      it('should increase state.value and call onChange()', function () {
        props.value = MIN
        const wrapper = renderComponent(props)
        wrapper.instance().onUpPress()

        expect(wrapper.state().value).toEqual(props.value + 1)
        expect(props.onChange.mock.calls.length).toEqual(1)
      })
    })
    describe('new value exceeds range ', function () {
      it('should keep state.value as current value and  not call onChange()', function () {
        props.value = MAX
        const wrapper = renderComponent(props)

        wrapper.instance().onUpPress()

        expect(wrapper.state().value).toEqual(props.value)
        expect(props.onChange.mock.calls.length).toEqual(0)
      })
    })
    describe('provided this.props.onUpPress from props ', function () {
      it('should  call this.props.onUpPress()', function () {
        props.onUpPress = jest.fn()
        const wrapper = renderComponent(props)

        wrapper.instance().onUpPress()

        expect(props.onUpPress.mock.calls.length).toEqual(0)
      })
    })
  })
  describe('When pressing Down ', function () {
    describe('new value is still in range ', function () {
      it('should increase state.value and call onChange()', function () {
        props.value = MAX
        const wrapper = renderComponent(props)
        wrapper.instance().onDownPress()

        expect(wrapper.state().value).toEqual(props.value - 1)
        expect(props.onChange.mock.calls.length).toEqual(1)
      })
    })
    describe('new value exceeds range ', function () {
      it('should keep state.value as current value and  not call onChange()', function () {
        props.value = MIN
        const wrapper = renderComponent(props)

        wrapper.instance().onDownPress()

        expect(wrapper.state().value).toEqual(props.value)
        expect(props.onChange.mock.calls.length).toEqual(0)
      })
    })
    describe('provided this.props.onDownPress from props ', function () {
      it('should  call this.props.onDownPress()', function () {
        props.onDownPress = jest.fn()
        const wrapper = renderComponent(props)

        wrapper.instance().onDownPress()

        expect(props.onDownPress.mock.calls.length).toEqual(0)
      })
    })
  })
  describe('When pressing Enter ', function () {
    it('should call onChange()', function () {
      const wrapper = renderComponent(props)
      event.key = 'Enter'
      wrapper.instance().onKeyDown(event)

      expect(props.onChange.mock.calls.length).toEqual(1)
    })
  })

  describe('When passing formatter ', function () {
    it('should call onChange()', function () {
      props.value = MAX
      const wrapper = renderComponent({...props, formatter: (val) => `${val}%`})
      event.key = 'Enter'
      wrapper.instance().onKeyDown(event)

      expect(props.onChange.mock.calls.length).toEqual(1)
      expect(props.onChange.mock.calls[0]).toEqual([MAX])
      expect(wrapper.find('input').props().value).toEqual(`${MAX}%`)
    })
  })

  describe('Provided prop disabled ', function () {
    it('should render the Down Btn as disabled and Up Btn as disabled', function () {
      props.disabled = true
      const wrapper = renderComponent(props)
      expect(wrapper.find(Arrows).props().isUpEnabled).toEqual(false)
      expect(wrapper.find(Arrows).props().isDownEnabled).toEqual(false)
    })
  })

  describe('Provided prop hideNumber ', function () {
    it('should render the Down Btn as disabled and Up Btn as disabled', function () {
      props.hideNumber = true
      props.value = 2
      const wrapper = renderComponent(props)
      expect(wrapper.find('input').props().value).toEqual('')
    })
  })

  describe('Provided props width and height ', function () {
    it('should render the Down Btn as disabled and Up Btn as disabled', function () {
      props.width = '100px'
      props.height = '200px'
      const wrapper = renderComponent(props)
      expect(wrapper.find('.input-counter-wrapper').props().style).toEqual({
        '--number-input-width': props.width,
        '--number-input-height': props.height
      })
    })
  })
})
