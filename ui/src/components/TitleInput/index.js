import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import css from './TitleInput.scss'

const ParentWrap = ({wrap, children}) => {
  if (wrap) {
    return (
      <div className={css.title_wrapper}>
        {children}
      </div>
    )
  } else {
    return (
      <Fragment>
        {children}
      </Fragment>
    )
  }
}

const TitleInput = ({title, disabled, className, children, prefix, suffix, alert, ...rest}) => {
  const childrenExist = Boolean(children)
  return (
    <ParentWrap wrap={childrenExist}>
      <label {...rest} className={classnames(className, css.title, {
        [css['title--disabled']]: disabled,
        [css['title--alert']]: alert
      })}>
        {prefix && <label className={css.prefix}>{prefix}&nbsp;</label>}
        {title}
        {suffix && <label className={css.suffix}>&nbsp;{suffix}</label>}
      </label>
      {children ? <div>{children}</div> : undefined}
    </ParentWrap>
  )
}

TitleInput.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]).isRequired,
  prefix: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  suffix: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  alert: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string
}

export default TitleInput
