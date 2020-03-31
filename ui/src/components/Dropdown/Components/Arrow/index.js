import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import FontAwesome from '../../../../components/FontAwesome/FontAwesome.export'

import style from './Arrow.scss'

const SelectedText = ({ disabled }) => {
  return (
    <div className={classnames(style.arrow, {
      [style['arrow--disabled']]: disabled
    })}
    >
      <FontAwesome className={style.arrow__icon} icon='caret-down' />
    </div>
  )
}

SelectedText.propTypes = {
  disabled: PropTypes.bool
}

export default SelectedText
