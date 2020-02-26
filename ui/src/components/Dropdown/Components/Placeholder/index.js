import React from 'react'
import style from './Placeholder.scss'

const Placeholder = (props) => {
  return (
    <label {...props} className={style.placeholder} />
  )
}

export default Placeholder
