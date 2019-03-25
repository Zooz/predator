import React from 'react'
import PropTypes from 'prop-types'
import css from './TableSearchResults.scss'

const SearchResults = ({children, prefix, suffix}) => {
  return (
    <div className={css.results}>
      {prefix} <label className={css.number}>{children}</label> {suffix}
    </div>
  )
}

SearchResults.propTypes = {
  prefix: PropTypes.string,
  suffix: PropTypes.string
}

SearchResults.defaultProps = {
  prefix: 'Found',
  suffix: 'results'
}

export default SearchResults
