import React from 'react'
import PropTypes from 'prop-types'
import style from './ErrorWrapper.scss'

const ErrorWrapper = (props) => {
  const { errorText, children } = props
  const hasError = !!errorText
  return (
    <span className={style['error-wrapper']}>
      {React.cloneElement(children, { error: hasError })}
      {hasError && (
        <div data-test='input-error' className={style['error-text']}>
          {errorText}
        </div>
      )}
    </span>
  )
}

ErrorWrapper.propTypes = {
  errorText: PropTypes.string
}

export default ErrorWrapper
