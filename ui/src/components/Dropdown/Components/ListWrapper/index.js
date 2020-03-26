import React from 'react'
import style from './ListWrapper.scss'

const ListWrapper = (props) => {
  return (
    <div {...props} data-test='options-list' className={style.wrapper} />
  )
}

export default ListWrapper
