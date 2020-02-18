import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import styles from './TabContent.scss'

const TabContent = ({ children, lazy, isActive }) => {
  const [shouldRender, setShouldRender] = useState(isActive || !lazy)

  useEffect(() => {
    if (!shouldRender) {
      setShouldRender(isActive || !lazy)
    }
    // TODO: fix
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, lazy])

  return (
    <div className={classNames(styles['tab-pane-content'], {
      [styles['tab-pane-content--active']]: isActive,
      [styles['tab-pane-content--inactive']]: !isActive
    })}
    >
      {shouldRender && children}
    </div>
  )
}

TabContent.propTypes = {
  lazy: PropTypes.bool,
  isActive: PropTypes.bool.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
}

TabContent.defaultProps = {
  lazy: true
}

export default TabContent
