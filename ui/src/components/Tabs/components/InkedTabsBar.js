import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import TabBarNode from './TabBarNode'

import styles from './InkedTabsBar.scss'

const InkedTabsBar = (
  {
    onTabClick,
    activeKey,
    style,
    tabs,
    setContainerWidth,
    setActiveTabSizes
  }
) => {
  const [inkStyle, setInkStyle] = useState({})
  let activeTabRef = null

  useEffect(() => {
    if (activeTabRef) {
      const { clientWidth, offsetLeft } = activeTabRef
      setInkStyle({
          // borderBottom: '3px solid #557eff'

      })
      setActiveTabSizes(clientWidth, offsetLeft)
    }
    // TODO: fix
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey])

  return (
    <div
      ref={(containerRef) => {
        if (containerRef) {
          setContainerWidth(containerRef.clientWidth)
        }
      }}
      style={style}
      className={styles['tabs-container']}
    >
      <div style={inkStyle} />
      {
        tabs.map(({ key, tab }) => {
          const tabClickHandler = () => {
            onTabClick(key)
          }
          const isActive = key === activeKey

          return (
            <TabBarNode
              tabName={tab}
              key={key}
              ref={(tabRef) => {
                if (isActive) {
                  activeTabRef = tabRef
                }
              }}
              isActive={isActive}
              onTabClick={tabClickHandler}
            />
          )
        })
      }
    </div>
  )
}

InkedTabsBar.propTypes = {
  onTabClick: PropTypes.func,
  activeKey: PropTypes.string.isRequired,
  style: PropTypes.object,
  tabs: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    tab: PropTypes.string
  })).isRequired,
  setContainerWidth: PropTypes.func.isRequired,
  setActiveTabSizes: PropTypes.func.isRequired
}

InkedTabsBar.defaultProps = {
  onTabClick: _.noop,
  style: {},
  setContainerWidth: _.noop,
  setActiveTabSizes: _.noop
}

export default InkedTabsBar
