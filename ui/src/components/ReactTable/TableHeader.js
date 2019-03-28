import React from 'react'
import PropTypes from 'prop-types'
import css from './style/header.scss'

export default function TableHeader ({children, className, onClick, sortable, up, down, padding}) {
  return (
    <div onClick={onClick} className={[css['header-wrapper'], className].join(' ')} style={{
      '--header-padding': padding
    }}>
      <span className={css['header-text']}>
        {children}
        {sortable &&
        (
          <div className={css['header-sorters']}>
            <i className='fa fa-caret-up' sorted={(!!up).toString()} />
            <i className='fa fa-caret-down' sorted={(!!down).toString()} />
          </div>
        )
        }
      </span>
    </div>
  )
}

TableHeader.defaultProps = {
  className: '',
  padding: '12px'
}

TableHeader.propTypes = {
  sortable: PropTypes.bool,
  className: PropTypes.string,
  padding: PropTypes.string,
  onClick: PropTypes.func,
  up: PropTypes.bool,
  down: PropTypes.bool
}
