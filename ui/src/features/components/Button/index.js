import React from 'react';
import style from './button.scss';
import classnames from 'classnames';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import CircularProgress from 'material-ui/CircularProgress';

const Button = (props) => {
    const {label, onClick, className, menuActions, actionHandler, isLoading, disabled} = props;

    return (
        <div onClick={isLoading || disabled ? undefined : onClick} className={classnames(style['button-wrapper'], {
            [style['button-without-menu']]: !menuActions,
            [style['disable']]: isLoading || disabled
        }, className)}>
            {!isLoading && <span className={classnames({[style['label']]: menuActions})}>{label}</span>}
            {isLoading && <CircularProgress size={20}/>}
            {
                menuActions &&
                <div><IconMenu
                    onItemClick={(event, selectedElement) => {
                        actionHandler(selectedElement.props.primaryText)
                    }}
                    iconButtonElement={<IconButton style={{padding: '0', width: '0'}}><MoreVertIcon/></IconButton>}
                    anchorOrigin={{horizontal: 'left', vertical: 'top'}}
                    targetOrigin={{horizontal: 'left', vertical: 'top'}}
                    listStyle={{zIndex: '99999999'}}
                    menuStyle={{zIndex: '99999999'}}
                    style={{zIndex: '99999999'}}
                >
                    {
                        menuActions.map((action, index) => {
                            return (<MenuItem key={index} primaryText={action}/>)
                        })
                    }
                </IconMenu>
                </div>
            }

        </div>)
};

export default Button;
