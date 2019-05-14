import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import TextareaAutosize from 'react-autosize-textarea'
import css from './TextArea.scss'

const TextArea = React.forwardRef(({ error, className, height, ...rest }, ref) => {
  const classes = classnames(className, css['textarea'], {
    [css['textarea--error']]: error,
    [css['textarea--disabled']]: rest.disabled
  })
  return (
    <TextareaAutosize ref={ref}
      async={false}
      style={{
        '--textarea-height': height
      }} className={classes} {...rest} />
  )
})

TextArea.propTypes = {
  error: PropTypes.bool,
  disabled: PropTypes.bool,
  height: PropTypes.string,
  className: PropTypes.string
}

TextArea.defaultProps = {
  height: '35px'
}

export default TextArea
