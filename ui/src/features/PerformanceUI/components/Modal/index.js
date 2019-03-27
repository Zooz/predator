import React from 'react'
import {faTimes} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

import style from './style.scss';

class Modal extends React.Component {

    onEscape=()=>{
        if(this.props.onExit){
            this.props.onExit();
        }
    };

    componentDidMount() {
        document.addEventListener("keydown", (event) => {
            if (event.key === 'Escape') {
                this.onEscape();
            }
        }, false);
    }

    componentWillUnmount(){
        document.removeEventListener("keydown", this.onEscape, false);
    }


    render(){
        const {children} = this.props;
        return (
            <div className={style['modal']}>
                <div className={style['modal-content']}>
                    <div className={style['icon-wrapper']}>
                        <FontAwesomeIcon className={style["exit-icon"]} onClick={this.onEscape} icon={faTimes}/>
                    </div>
                    {children}
                </div>
            </div>
        )
    }

}

export default Modal;
