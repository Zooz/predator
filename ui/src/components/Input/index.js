import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import css from './Input.scss'

const Input = React.forwardRef(({error, className, height, value, ...rest}, ref) => {
    const classes = classnames(className, css['input'], {
        [css['input--error']]: error,
        [css['input--disabled']]: rest.disabled
    })
    return (
        <input ref={ref} value={value} style={{
            '--input-height': height
        }} className={classes} {...rest} />
    )
})

Input.propTypes = {
    error: PropTypes.bool,
    disabled: PropTypes.bool,
    height: PropTypes.string,
    className: PropTypes.string
}

Input.defaultProps = {
    height: '35px'
}

export default Input
