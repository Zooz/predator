import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import _ from 'lodash'

import FontAwesome from '../../FontAwesome/FontAwesome.export'

import styles from './ScrollButton.scss'

const ScrollButton = ({ isDisabled, onButtonClick, direction }) => (
  <div
    onClick={onButtonClick}
    className={classNames(styles['scroll-button-box'],
      styles[`scroll-button-box-${direction}`],
      {
        [styles['scroll-button-box--disabled']]: isDisabled
      }
    )}
  >
    <FontAwesome
      className={styles['scroll-button-box__arrow']}
      icon={`chevron-${direction}`}
    />
  </div>
)

export const ScrollButtonDirections = {
  LEFT: 'left',
  RIGHT: 'right'
}

ScrollButton.propTypes = {
  isDisabled: PropTypes.bool,
  onButtonClick: PropTypes.func,
  direction: PropTypes.oneOf(Array.from(Object.values(ScrollButtonDirections)))
}

ScrollButton.defaultProps = {
  isDisabled: false,
  onButtonClick: _.noop
}

export default ScrollButton
