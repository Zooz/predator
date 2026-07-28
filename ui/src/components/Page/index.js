import React from 'react'
import style from './style.scss'
import classnames from 'classnames'

// Shared page frame. `eyebrow` names the section above the title and `actions`
// takes the page's primary control, so every list page gets the same header
// anatomy instead of a title floating above a loose button.
class Page extends React.Component {
  render () {
    const { title, description, eyebrow, actions, children, className } = this.props
    return (
      <div className={classnames(className, style.page)}>
        <div className={style.content}>
          {(title || description) && (
            <div className={style.header}>
              <div className={style.heading}>
                {eyebrow && <span className={style.eyebrow}>{eyebrow}</span>}
                {title && <h1 className={style.title}>{title}</h1>}
                {description && <p className={style.description}>{description}</p>}
              </div>
              {actions && <div>{actions}</div>}
            </div>
          )}
          {children}
        </div>
      </div>
    )
  }
}

export default Page
