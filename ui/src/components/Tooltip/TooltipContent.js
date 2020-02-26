import React from 'react'
import PropTypes from 'prop-types'

import SideNote from './SideNote/SideNote.export'

import style from './Tooltip.scss'

const TooltipContent = ({ children }) => {
  return (
    <SideNote className={style.tooltip__content}>{children}</SideNote>
  )
}

TooltipContent.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
}

export default TooltipContent
