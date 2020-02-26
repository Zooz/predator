import React from 'react'
import style from './Filter.scss'

const Filter = React.forwardRef((props, ref) => {
  return (
    <div data-test='filter-input' className={style['filter-wrapper']}>
      <input
        {...props}
        autoFocus
        ref={ref}
        className={style['filter-input']}
        placeholder='Filter...'
      />
    </div>
  )
})

Filter.propTypes = {

}

export default Filter
