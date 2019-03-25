import React from 'react'
import PropTypes from 'prop-types'
import css from './NoMoreResults.scss'

const SearchResults = ({text}) => {
  return (
    <div className={css['no-more-results']}>
      {text}
    </div>
  )
}

SearchResults.propTypes = {
  text: PropTypes.string
}

SearchResults.defaultProps = {
  text: 'No additional results'
}

export default SearchResults
