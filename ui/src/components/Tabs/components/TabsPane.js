import React from 'react'
import PropTypes from 'prop-types'

const TabPane = ({ children,style }) => (<div style={style}>{children}</div>)

TabPane.propTypes = {
  children: PropTypes.any,
  // eslint-disable-next-line react/no-unused-prop-types
  lazy: PropTypes.bool,
  // eslint-disable-next-line react/no-unused-prop-types
  tab: PropTypes.string.isRequired
}

TabPane.defaultProps = {
  lazy: true
}

export default TabPane
