import React from 'react'
import PropTypes from 'prop-types'

import style from './SelectedText.scss'

const SelectedText = ({ children }) => {
  return (
    <div className={style.selected}>
      {children}
    </div>
  )
}

SelectedText.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
}

export default SelectedText
