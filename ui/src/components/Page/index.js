import React from 'react'
import style from './style.scss'

class Page extends React.Component {
  render () {
    const { title, description, children } = this.props;
    return (
      <div className={style.page}>
        <div className={style.content}>
          <div className={style.title}>{title}</div>
          <div className={style.description}>{description}</div>
          {children}
        </div>
      </div>
    )
  }
}

export default Page;
