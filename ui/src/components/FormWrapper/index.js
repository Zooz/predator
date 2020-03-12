import React from 'react'
import style from './style.scss'
import classnames from 'classnames';


const FormWrapper = ({children,title,description})=>{

    return (
            <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
                <div className={style.title}>{title}</div>
                {description && <div className={style.description}>{description}</div>}
                <div className={style.content}>
                    {children}
                </div>
            </div>
    )
}

export default FormWrapper
