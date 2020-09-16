import React from 'react'
import style from './style.scss'
import classnames from 'classnames';

class Page extends React.Component {
    render() {
        const {title, description, children, className} = this.props;
        return (
            <div className={classnames(className, style.page)}>
                <div className={style.content}>
                    {title && <div className={style.title}>{title}</div>}
                    {description && <div className={style.description}>{description}</div>}
                    {children}
                </div>
            </div>
        )
    }
}

export default Page;
