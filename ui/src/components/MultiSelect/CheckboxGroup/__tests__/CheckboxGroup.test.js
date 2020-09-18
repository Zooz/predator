/* eslint-env jest */

import React from 'react'
import { mount } from 'enzyme'
import CheckboxGroup from '..'
import LabeledCheckbox from '../../../../LabeledCheckbox/LabeledCheckbox.export'

const mountComponent = (props) => {
  return mount(<CheckboxGroup {...props} />)
}

const OPTIONS = [
  {
    key: 'key-a',
    value: 'value-a'
  }, {
    key: 'key-b',
    value: 'value-b'
  }, {
    key: 'key-c',
    value: 'value-c'
  }
]

describe('<CheckboxGroup />', () => {
  let checkBoxGroupComponent, defaultProps

  beforeAll(() => {
    defaultProps = {
      options: OPTIONS,
      checkedOptions: []
    }
  })

  describe('PROPS', () => {
    describe('Options', () => {
      it('Should render an empty group if options is not given', () => {
        // Arrange
        const props = Object.assign({}, defaultProps, { options: undefined })
        checkBoxGroupComponent = mountComponent(props)

        // Assert
        const renderedOptions = checkBoxGroupComponent.find(LabeledCheckbox)
        expect(renderedOptions).toHaveLength(0)
      })
      it('Should render an empty group if options is an empty array', () => {
        // Arrange
        const props = Object.assign({}, defaultProps, { options: [] })
        checkBoxGroupComponent = mountComponent(props)

        // Assert
        const renderedOptions = checkBoxGroupComponent.find(LabeledCheckbox)
        expect(renderedOptions).toHaveLength(0)
      })
      it('Should render the given options as a list of LabeledCheckbox components', () => {
        // Arrange
        checkBoxGroupComponent = mountComponent(defaultProps)

        // Assert
        const renderedOptions = checkBoxGroupComponent.find(LabeledCheckbox)
        expect(renderedOptions).toHaveLength(OPTIONS.length)
        renderedOptions.forEach((option, i) => {
          expect(option.text()).toEqual(OPTIONS[i].value)
        })
      })
    })

    describe('CheckedOptions', () => {
      it('Should render a list of unchecked LabeledCheckbox components - empty check options', () => {
        // Arrange
        const props = Object.assign({}, defaultProps, { checkedOptions: undefined })
        checkBoxGroupComponent = mountComponent(props)

        // Assert
        const renderedOptions = checkBoxGroupComponent.find(LabeledCheckbox)
        renderedOptions.forEach((option) => {
          expect(option.prop('checked')).toBe(false)
        })
      })
      it('Should render a list of unchecked LabeledCheckbox components', () => {
        // Arrange
        checkBoxGroupComponent = mountComponent(defaultProps)

        // Assert
        const renderedOptions = checkBoxGroupComponent.find(LabeledCheckbox)
        renderedOptions.forEach((option) => {
          expect(option.prop('checked')).toBe(false)
        })
      })
      it('Should render the given checkedOptions as a checked LabeledCheckbox components', () => {
        // Arrange
        const givenCheckedOption = OPTIONS[0]
        const props = Object.assign({}, defaultProps, { checkedOptions: [givenCheckedOption.key] })
        checkBoxGroupComponent = mountComponent(props)

        // Assert
        const renderedOptions = checkBoxGroupComponent.find(LabeledCheckbox)
        renderedOptions.forEach((option) => {
          const isGivenCheckedOption = givenCheckedOption.value.includes(option.text())
          expect(option.prop('checked')).toBe(isGivenCheckedOption)
        })
      })
    })

    describe('ClassName', () => {
      it('Should NOT pass any className property to the wrapper component div if className is not given', () => {
        // Arrange
        checkBoxGroupComponent = mountComponent(defaultProps)

        // Assert
        const optionsGroupComponent = checkBoxGroupComponent.find('[data-test="checkbox-group"]')
        expect(optionsGroupComponent.prop('className')).toBe(undefined)
      })

      it('Should pass the given className to the wrapper component div', () => {
        // Arrange
        const givenClassName = 'this-is-className'
        const props = Object.assign({}, defaultProps, { className: givenClassName })
        checkBoxGroupComponent = mountComponent(props)

        // Assert
        const optionsGroupComponent = checkBoxGroupComponent.find('[data-test="checkbox-group"]')
        expect(optionsGroupComponent.prop('className')).toBe(givenClassName)
      })
    })

    describe('OnChange', () => {
      it('Should call onChange when option checked status is changed - Selected', () => {
        // Arrange
        const checkedOptionIndex = 0
        const props = Object.assign({}, defaultProps, { onChange: jest.fn() })
        checkBoxGroupComponent = mountComponent(props)

        // Act - check the first option
        const renderedOptions = checkBoxGroupComponent.find(LabeledCheckbox)
        renderedOptions.at(checkedOptionIndex).simulate('click')

        // Assert - onChange is called
        expect(props.onChange.mock.calls.length).toBe(1)
        expect(props.onChange.mock.calls[0][0]).toEqual([OPTIONS[checkedOptionIndex].key])
      })
      it('Should call onChange when option checked status is changed - Unselected', () => {
        // Arrange
        const checkedOptionIndex = 0
        const props = Object.assign({}, defaultProps, {
          checkedOptions: [OPTIONS[checkedOptionIndex].key],
          onChange: jest.fn()
        })
        checkBoxGroupComponent = mountComponent(props)

        // Act - un-check the first option
        const renderedOptions = checkBoxGroupComponent.find(LabeledCheckbox)
        expect(renderedOptions.at(checkedOptionIndex).prop('checked')).toBe(true)
        renderedOptions.at(checkedOptionIndex).simulate('click')

        // Assert - onChange is called
        expect(props.onChange.mock.calls.length).toBe(1)
        expect(props.onChange.mock.calls[0][0]).toEqual([])
      })
    })
  })
})
