import React, { useState, useRef, useEffect } from 'react'
import classnames from 'classnames'
import _ from 'lodash'

import css from '../styles/Body.scss'
import PropTypes from 'prop-types'

const MINIMAL_MAX_HEIGHT = 1400

const Body = ({ expanded, body, disabled, className }) => {
  const contentRef = useRef(null)
  const [contentHeight, setContentHeight] = useState(MINIMAL_MAX_HEIGHT)

  const getContentHeight = () => {
    return _.get(contentRef, ['current', 'scrollHeight'])
  }

  useEffect(() => {
    const newContentHeight = getContentHeight()
    if (newContentHeight > contentHeight) {
      setContentHeight(newContentHeight)
    }
  // TODO: fix
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, expanded])

  const collapsibleBodyClass = classnames({
    [css.collapsibleBody]: expanded,
    [css['collapsibleBody--hidden']]: !expanded,
    [className]: !!className,
    [css.disabled]: disabled
  })
  return (
    <div
      ref={contentRef} style={{
        '--content-height': `${contentHeight}px`
      }} className={collapsibleBodyClass}
    >
      {body}
    </div>
  )
}

Body.propTypes = {
  expanded: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  body: PropTypes.element
}
Body.defaultProps = {
  expanded: false,
  disabled: false
}
export default Body
