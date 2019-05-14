import React from 'react'
import PropTypes from 'prop-types'
import { noop } from 'lodash'
import style from './style/Chip.scss'
import classnames from 'classnames'
import {faTimes} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

const Chip = (props) => {
  const { children, onRemove, className, ...rest } = props
  return (
    <div className={classnames(className, style['item'])} key={children} {...rest}>
      {children}
        <FontAwesomeIcon className={style['button-remove']} icon={faTimes}
                         onClick={event => {
                             event.stopPropagation()
                             onRemove(children)
                         }}
        />
    </div>
  )
}

Chip.propTypes = {
  className: PropTypes.string,
  children: PropTypes.any.isRequired,
  onRemove: PropTypes.func.isRequired
}
Chip.defaultProps = {
  children: '',
  onRemove: noop
}

export default Chip
