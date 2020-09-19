import React, { useState } from 'react'
import PropTypes from 'prop-types'

import LabeledCheckbox from '../../LabeledCheckbox/LabeledCheckbox.export'

import style from './OptionItem.scss'

const OptionItem = ({ children, ...props }) => {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <LabeledCheckbox
      {...props}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={style['option-item']}
      checkboxClassName={style['option-item__checkbox']}
    >
      <span className={style['option-item__option']}>
        {React.isValidElement(children) ? React.cloneElement(children, { isHover: isHovering }) : children}
      </span>
    </LabeledCheckbox>
  )
}

OptionItem.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
}

export default OptionItem
