import React from 'react'
import style from './ItemsWrapper.scss'

const ItemsWrapper = (props) => {
  return (
    <div {...props} className={style.wrapper} />
  )
}

export default ItemsWrapper
