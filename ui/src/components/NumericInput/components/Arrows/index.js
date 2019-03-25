import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import style from './Arrows.scss'

const Arrows = ({onUpPress, onDownPress, isUpEnabled, isDownEnabled}) => {
  return (
    <span className={style['arrows-wrapper']}>
      <i
        data-arrow='up'
        className={classnames('fa fa-caret-up', style['arrow'], style['up-arrow'], {[style['enabled']]: isUpEnabled})}
        onMouseDown={onUpPress} />
      <i
        data-arrow='down'
        className={classnames('fa fa-caret-down', style['arrow'], style['down-arrow'], {[style['enabled']]: isDownEnabled})}
        onMouseDown={onDownPress} />
    </span>
  )
}

Arrows.propTypes = {
  onUpPress: PropTypes.func.isRequired,
  onDownPress: PropTypes.func.isRequired,
  isUpEnabled: PropTypes.bool,
  isDownEnabled: PropTypes.bool
}

Arrows.defaultProps = {
  isUpEnabled: true,
  isDownEnabled: true
}
export default Arrows
