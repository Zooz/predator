import React from 'react'
import style from './style.scss'
import classnames from 'classnames';


const FormWrapper = ({children,title,description})=>{

    return (
            <div style={{display:'flex',flexDirection:'column'}}>
                <div className={style.title}>{title}</div>
                <div className={style.description}>{description}</div>
                <div className={style.content}>
                    {children}
                </div>
            </div>
    )
}

export default FormWrapper
