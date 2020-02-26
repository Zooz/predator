import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './TabContent.scss'

const TabContent = ({ children }) => {

  return (
    <div className={classNames(styles['tab-pane-content'],styles['tab-pane-content--active'])}
    >
      {children}
    </div>
  )
}

TabContent.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
}

export default TabContent
