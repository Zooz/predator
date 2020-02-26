import React from 'react'
import PropTypes from 'prop-types'

import css from './Arrow.scss'

const Arrow = ({ arrowProps, placement }) => {
  return (
    <div ref={arrowProps.ref} data-placement={placement} className={css.popper__arrow} style={arrowProps.style} />
  )
}

Arrow.propTypes = {
  arrowProps: PropTypes.object,
  placement: PropTypes.string
}

export default Arrow
