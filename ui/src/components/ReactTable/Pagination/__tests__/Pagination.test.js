/* eslint-env jest */

import React from 'react'
import { shallow } from 'enzyme'
import Pagination from '../index'

const DESCRIPTION_SELECTOR = '.description label'
const PAGE_SWITCHER_SELECTOR = '.page-switcher'
const NEXT_SELECTOR = '.fa-angle-right'
const PREVIOUS_SELECTOR = '.fa-angle-left'
const CURRENT_PAGE_SELECTOR = '[currentpage="true"]'

describe('<Pagination />', () => {
  const renderComponent = (props) => {
    return shallow(<Pagination {...props} />)
  }

  describe('When there is no data ', () => {
    let props
    let wrapper
    beforeEach(() => {
      props = {
        page: 0
      }

      wrapper = renderComponent(props)
    })

    it('should show correct pages', () => {
      expect(wrapper.find(DESCRIPTION_SELECTOR).text()).toEqual('0-0 of 0')
    })
    it('should not have page switcher', () => {
      expect(wrapper.find(PAGE_SWITCHER_SELECTOR).length).toEqual(0)
    })
  })

  describe('When there is data count ', () => {
    let props
    let wrapper
    beforeEach(() => {
      props = {
        page: 2,
        totalDataCount: 200,
        pages: 20,
        pageSize: 10,
        onPageChange: jest.fn()
      }

      wrapper = renderComponent(props)
    })

    it('should show correct pages', () => {
      expect(wrapper.find(DESCRIPTION_SELECTOR).text()).toEqual('21-30 of 200')
      expect(wrapper.find(CURRENT_PAGE_SELECTOR).text()).toEqual('21-30 of 200')
    })
    it('should have page switcher', () => {
      const pageSwitcher = wrapper.find(PAGE_SWITCHER_SELECTOR)
      expect(pageSwitcher.length).toEqual(1)
      const pagesInSwitcher = pageSwitcher.children().map((child) => child.text())
      expect(pagesInSwitcher).toEqual([
        '1-10 of 200',
        '11-20 of 200',
        '21-30 of 200',
        '31-40 of 200',
        '41-50 of 200',
        '51-60 of 200',
        '61-70 of 200',
        '71-80 of 200',
        '81-90 of 200',
        '91-100 of 200',
        '101-110 of 200',
        '111-120 of 200',
        '121-130 of 200',
        '131-140 of 200',
        '141-150 of 200',
        '151-160 of 200',
        '161-170 of 200',
        '171-180 of 200',
        '181-190 of 200',
        '191-200 of 200'
      ])
    })
  })

  describe('When there is actual data', () => {
    it('should show correct pages', () => {
      const data = []
      for (let i = 0; i < 200; i++) {
        data.push(i)
      }
      const props = {
        page: 2,
        data,
        pageSize: 10
      }
      const wrapper = renderComponent(props)
      expect(wrapper.find(DESCRIPTION_SELECTOR).text()).toEqual('21-30 of 200')
    })
  })

  describe('Next button ', () => {
    describe('Enabled ', () => {
      let props
      let wrapper
      beforeEach(() => {
        props = {
          page: 1,
          canNext: true,
          onPageChange: jest.fn()
        }

        wrapper = renderComponent(props)
      })

      it('should call the onPageChange callback when clicked', () => {
        expect(props.onPageChange.mock.calls.length).toEqual(0, 'should not call callback on render')
        wrapper.find(NEXT_SELECTOR).simulate('click')
        expect(props.onPageChange.mock.calls.length).toEqual(1, 'should call callback on click')
        expect(props.onPageChange.mock.calls[0][0]).toEqual(props.page + 1, 'should call callback with next page value')
      })
    })
    describe('Disabled ', () => {
      let props
      let wrapper
      beforeEach(() => {
        props = {
          page: 1,
          canNext: false,
          onPageChange: jest.fn()
        }

        wrapper = renderComponent(props)
      })

      it('should not call the onPageChange callback when clicked', () => {
        expect(props.onPageChange.mock.calls.length).toEqual(0, 'should not call callback on render')
        wrapper.find(NEXT_SELECTOR).simulate('click')
        expect(props.onPageChange.mock.calls.length).toEqual(0, 'should not call callback on click')
      })
    })
  })

  describe('Previous button ', () => {
    describe('Enabled ', () => {
      let props
      let wrapper
      beforeEach(() => {
        props = {
          page: 1,
          canPrevious: true,
          onPageChange: jest.fn()
        }

        wrapper = renderComponent(props)
      })

      it('should call the onPageChange callback when clicked', () => {
        expect(props.onPageChange.mock.calls.length).toEqual(0, 'should not call callback on render')
        wrapper.find(PREVIOUS_SELECTOR).simulate('click')
        expect(props.onPageChange.mock.calls.length).toEqual(1, 'should call callback on click')
        expect(props.onPageChange.mock.calls[0][0]).toEqual(props.page - 1, 'should call callback with previous page value')
      })
    })
    describe('Disabled ', () => {
      let props
      let wrapper
      beforeEach(() => {
        props = {
          page: 1,
          canPrevious: false,
          onPageChange: jest.fn()
        }

        wrapper = renderComponent(props)
      })

      it('should not call the onPageChange callback when clicked', () => {
        expect(props.onPageChange.mock.calls.length).toEqual(0, 'should not call callback on render')
        wrapper.find(PREVIOUS_SELECTOR).simulate('click')
        expect(props.onPageChange.mock.calls.length).toEqual(0, 'should not call callback on click')
      })
    })
  })
})
