import React from 'react'
import PropTypes from 'prop-types'

import css from './index.scss'

const Spinner = ({ primaryColor, secondaryColor, invertedPrimaryColor, invertedSecondaryColor, size, inverted, thickness }) => {
  return (
    <div
      className={css.spinner}
      inverted={String(inverted)}
      style={{
        '--spinner-primary-color': primaryColor,
        '--spinner-secondary-color': secondaryColor,
        '--spinner-inverted-primary-color': invertedPrimaryColor,
        '--spinner-inverted-secondary-color': invertedSecondaryColor,
        '--spinner-size': size,
        '--spinner-thickness': thickness
      }}
    />
  )
}

Spinner.propTypes = {
  primaryColor: PropTypes.string,
  secondaryColor: PropTypes.string,
  invertedPrimaryColor: PropTypes.string,
  invertedSecondaryColor: PropTypes.string,
  size: PropTypes.string,
  inverted: PropTypes.bool,
  thickness: PropTypes.string
}

Spinner.defaultProps = {
  primaryColor: '#ffffff',
  invertedPrimaryColor: '#0d91bd',
  secondaryColor: 'rgba(255, 255, 255, 0.35)',
  invertedSecondaryColor: '#b8eaf9',
  size: '16px',
  thickness: '2px'
}

export default Spinner
