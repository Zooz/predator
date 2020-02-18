import React, { useReducer, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import _ from 'lodash'
import { withResizeDetector } from 'react-resize-detector'

import InkedTabsBar from './InkedTabsBar'
import ScrollButton, { ScrollButtonDirections } from './ScrollButton'

import * as actions from './TabsScrollingReducer/actions'
import reducer, { initialState } from './TabsScrollingReducer/reducer'

import styles from './ScrollableTabsNavBar.scss'

const ScrollableTabsNavBar = ({ width, tabs, onTabClick, activeKey }) => {
  const [state, dispatch] = useReducer(reducer, { ...initialState })
  const { shouldScroll, enableScrollLeft, enableScrollRight, scrollXValue } = state
  const scrollWrapperRef = useRef(null)
  const innerContainerWidthRef = useRef(0)
  const activeTabSizesRef = useRef({ width: 0, offsetLeft: 0 })

  useEffect(() => {
    dispatch({
      type: actions.ON_MOUNT,
      innerScrollWidth: innerContainerWidthRef.current,
      scrollWrapperWidth: scrollWrapperRef.current.clientWidth
    })
  }, [])

  useEffect(() => {
    dispatch({
      type: actions.ON_TAB_SELECTION,
      tabOffsetLeft: activeTabSizesRef.current.offsetLeft,
      tabWidth: activeTabSizesRef.current.width
    })
  }, [activeKey])

  useEffect(() => {
    dispatch({
      type: actions.ON_RESIZE,
      scrollWrapperWidth: scrollWrapperRef.current.clientWidth,
      tabOffsetLeft: activeTabSizesRef.current.offsetLeft,
      tabWidth: activeTabSizesRef.current.width,
      innerScrollWidth: innerContainerWidthRef.current
    })
  }, [width])

  function handleScrollLeft () {
    if (enableScrollLeft) {
      dispatch({ type: actions.ON_SCROLL_LEFT })
    }
  }

  function handleScrollRight () {
    if (enableScrollRight) {
      dispatch({ type: actions.ON_SCROLL_RIGHT })
    }
  }

  function handleTabClick (key) {
    onTabClick(key)
  }

  function setInnerContainerWidth (width) {
    if (innerContainerWidthRef.current && innerContainerWidthRef.current !== width) {
      dispatch({
        type: actions.ON_RESIZE,
        scrollWrapperWidth: scrollWrapperRef.current.clientWidth,
        tabOffsetLeft: activeTabSizesRef.current.offsetLeft,
        tabWidth: activeTabSizesRef.current.width,
        innerScrollWidth: width
      })
    }
    innerContainerWidthRef.current = width
  }

  function setActiveTabSizes (width = 0, offsetLeft = 0) {
    activeTabSizesRef.current = {
      width,
      offsetLeft
    }
  }

  return (
    <div
      ref={scrollWrapperRef} className={classNames(
        styles['scrolling-wrapper'],
        {
          [styles['scrolling-wrapper--no-scroll']]: !shouldScroll
        })}
    >
      {
        shouldScroll &&
          <ScrollButton
            isDisabled={!enableScrollLeft}
            onButtonClick={handleScrollLeft}
            direction={ScrollButtonDirections.LEFT}
          />
      }
      <InkedTabsBar
        activeKey={activeKey}
        onTabClick={handleTabClick}
        style={{
          transform: `translateX(${scrollXValue}px)`
        }}
        tabs={tabs}
        setContainerWidth={setInnerContainerWidth}
        setActiveTabSizes={setActiveTabSizes}
      />
      {
        shouldScroll &&
          <ScrollButton
            isDisabled={!enableScrollRight}
            onButtonClick={handleScrollRight}
            direction={ScrollButtonDirections.RIGHT}
          />
      }
      <hr className={styles['scrolling-wrapper__bottom-line']} />
    </div>
  )
}

ScrollableTabsNavBar.propTypes = {
  width: PropTypes.number,
  onTabClick: PropTypes.func,
  activeKey: PropTypes.string.isRequired,
  tabs: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    tab: PropTypes.string
  })).isRequired
}

ScrollableTabsNavBar.defaultProps = {
  onTabClick: _.noop,
  tabs: []
}

export default withResizeDetector(ScrollableTabsNavBar, {
  handleWidth: true,
  refreshMode: 'debounce',
  refreshRate: 150,
  skipOnMount: true
})
