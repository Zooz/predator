import React from 'react'
import PropTypes from 'prop-types'

import styles from './TabsContentContainer.scss'

const TabsContentContainer = ({ children, style }) => {
  return (
    <div style={style} className={styles['tabs-content']}>
      {children}
    </div>
  )
}

TabsContentContainer.propTypes = {
  style: PropTypes.object,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
}

TabsContentContainer.defaultProps = {
  style: {}
}

export default TabsContentContainer
