import React from 'react'
import PropTypes from 'prop-types'
import { CSSTransition } from 'react-transition-group'

import style from './transitions.scss'

export const FadingTransition = ({ children, isOpened }) => {
  return (
    <CSSTransition
      in={isOpened}
      timeout={200}
      classNames={{
        enter: style['fade-enter'],
        enterActive: style['fade-enter--active'],
        exit: style['fade-exit'],
        exitActive: style['fade-exit--active']
      }}
      unmountOnExit
    >
      {children}
    </CSSTransition>
  )
}

FadingTransition.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  isOpened: PropTypes.bool
}
