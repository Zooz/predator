import React from 'react'
import style from './style.scss'

class Page extends React.Component {
  render () {
    const { title, children } = this.props;
    return (
      <div className={style.page}>
        <h1>{title}</h1>
        {children}
      </div>
    )
  }
}

export default Page;
