import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'

import ScrollableTabsNavBar from './components/ScrollableTabsNavBar'
import TabsContentContainer from './components/TabsContentContainer'
import TabPane from './components/TabsPane'
import TabContent from './components/TabContent'

import styles from './Tabs.scss'

const Tabs = ({ children, defaultActiveKey }) => {
  const validChildren = []
  const validTabs = []

  React.Children.forEach(children, (child) => {
    const key = child.key
    const { tab } = child.props
    if (!child || !key || !tab) {
      console.error('Generic-UI-Components.Tabs: Invalid child props')
      return
    }
    validChildren.push(child)
    validTabs.push({ key, tab })
  })

  const validDefaultKey = validTabs.reduce((reduction, { key }) => {
    return (key === defaultActiveKey && key) || reduction || key
  }, null)

  const [currentKey, setCurrentKey] = useState(validDefaultKey)

  const currentKeyIdx = _.findIndex(validTabs, ({ key }) => key === currentKey)

  // update key on children change
  useEffect(() => {
    if (currentKeyIdx !== -1) {
      return
    }
    setCurrentKey(_.get(validTabs, '[0].key'))
    // TODO: fix
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children])

  return (validTabs.length === 0
    ? null
    : (
      <div className={styles.tabs}>
        <ScrollableTabsNavBar onTabClick={setCurrentKey} activeKey={currentKey} tabs={validTabs} />
        <TabsContentContainer style={{
          transform: `translateX(${currentKeyIdx * 100 * -1}%)`
        }}
        >
          {
            validChildren.map((child) => {
              const key = child.key
              const { tab, ...props } = child.props

              return (
                <TabContent key={key} isActive={currentKey === key} {...props}>
                  {child}
                </TabContent>
              )
            })
          }
        </TabsContentContainer>
      </div>
    )
  )
}

Tabs.TabPane = TabPane

Tabs.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired,
  defaultActiveKey: PropTypes.string.isRequired
}

export default Tabs
