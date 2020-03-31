import React from 'react'
import {faTimes} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import classnames from 'classnames';

import style from './style.scss';

class Modal extends React.Component {

    onEscape = () => {
        if (this.props.onExit) {
            this.props.onExit();
        }
    };

    componentDidMount() {
        document.addEventListener("keydown", (event) => {
            if (event.key === 'Escape') {
                this.onEscape();
            }
        });
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.onEscape);
    }


    render() {
        const {children, width, height, style: customStyle} = this.props;
        return (
            <div style={customStyle} className={style['modal']}>
                <div className={style['modal-content']} style={{width: width, height}}>
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
