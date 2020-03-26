/* eslint-env jest */

import React from 'react'
import { mount } from 'enzyme'
import ClickOutHandler from 'react-onclickout'
import DynamicDropdown from '../index'

const mountComponent = (props) => {
  return mount(<DynamicDropdown {...props} />)
}

const InputComponent = () => {
  return (
    <div>
      InputComponent
    </div>
  )
}
const ListOptionsComponent = () => {
  return (
    <div>
      ListOptionsComponent
    </div>
  )
}

describe('<DynamicDropdown /> - Unit Tests', () => {
  let component, defaultProps

  beforeAll(() => {
    defaultProps = {
      inputComponent: <InputComponent />,
      listOptionsComponent: <ListOptionsComponent />,
      isListOpen: false,
      onListClose: undefined
    }
  })

  describe('InputComponent', () => {
    it('Should render the given InputComponent', () => {
      // Arrange
      component = mountComponent(defaultProps)

      // Assert
      const inputComponent = component.find(InputComponent)
      expect(inputComponent).toHaveLength(1)
    })
  })
  describe('ListOptionsComponent', () => {
    it('Should NOT be rendered when isListOpen is set to false', () => {
      // Arrange
      component = mountComponent(defaultProps)

      // Assert
      const listComponent = component.find(ListOptionsComponent)
      expect(listComponent).toHaveLength(0)
    })
    it('Should be rendered when isListOpen is set to true', () => {
      // Arrange
      const props = Object.assign({}, defaultProps, { isListOpen: true })
      component = mountComponent(props)

      // Assert
      const listComponent = component.find(ListOptionsComponent)
      expect(listComponent).toHaveLength(1)
    })
    it('Should call onListClose when clicking outside the component', () => {
      // Arrange
      const props = Object.assign({}, defaultProps, { isListOpen: true, onListClose: jest.fn() })
      component = mountComponent(props)

      // Act
      const clickOutHandler = component.find(ClickOutHandler)
      clickOutHandler.instance().props.onClickOut()

      // Assert
      expect(props.onListClose.mock.calls).toHaveLength(1)
    })
  })
})
