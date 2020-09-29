import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import FontAwesome from '../../../FontAwesome/FontAwesome.export'

import style from './Arrows.scss'

const Arrows = ({ disabled, onUpPress, onDownPress, isUpEnabled, isDownEnabled }) => {
  return (
      <span className={style['arrows-wrapper']}>
      <FontAwesome
          data-arrow='up'
          icon='caret-up'
          className={classnames(style.arrow, style['up-arrow'], { [style.enabled]: isUpEnabled, [style['arrow--disabled']]: disabled })}
          onMouseDown={onUpPress}
      />
      <FontAwesome
          data-arrow='down'
          icon='caret-down'
          className={classnames(style.arrow, style['down-arrow'], { [style.enabled]: isDownEnabled, [style['arrow--disabled']]: disabled })}
          onMouseDown={onDownPress}
      />
    </span>
  )
}

Arrows.propTypes = {
  disabled: PropTypes.bool,
  onUpPress: PropTypes.func.isRequired,
  onDownPress: PropTypes.func.isRequired,
  isUpEnabled: PropTypes.bool,
  isDownEnabled: PropTypes.bool
}

Arrows.defaultProps = {
  disabled: false,
  isUpEnabled: true,
  isDownEnabled: true
}
export default Arrows
