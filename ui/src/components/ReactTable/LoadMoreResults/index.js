import React from 'react'
import PropTypes from 'prop-types'
import css from './LoadMoreResults.scss'

const LoadMoreResults = ({text, onClick}) => {
  return (
    <div onClick={onClick} className={css['load-more-results']}>
      {text}
    </div>
  )
}

LoadMoreResults.propTypes = {
  text: PropTypes.string,
  onClick: PropTypes.func
}

LoadMoreResults.defaultProps = {
  text: 'LOAD MORE'
}

export default LoadMoreResults
