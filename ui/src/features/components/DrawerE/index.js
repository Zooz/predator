import React, {Component} from 'react'
import {Drawer, AppBar, ListItem, List} from 'material-ui'
import style from './style.scss'
import {connect} from 'react-redux'
import history from '../../../store/history';
import logo from '../../../images/logo.png';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {VERSION} from '../../../App/common/env';


const Logo = () => {

    return (
        <div className={style['logo-wrapper']}>
            <img width={'40px'} src={logo} alt={'Mickey'}/>
            <span className={style['logo-text']}>Predator</span>
        </div>
    )
}

class DrawerE extends Component {
    constructor(props) {
        super(props);

        this.state = {open: props.open};
    }

    handleToggle = () => {
        this.setState({open: !this.state.open});
    };

    handleClose = () => {
        this.setState({open: false});
    };

    apiClick = (navigateTo) => {
        history.push(navigateTo);
    };

    render() {
        const {open} = this.state;
        const {url, history} = this.props;
        const classes = [style.drawer, open ? style['drawer--open'] : undefined].join(' ');
        const {listItemData} = this.props;
        const appLogoTitleStyle = {
            whiteSpace: 'initial',
            overflow: 'initial',
            textOverflow: 'initial',
            margin: 'unset',
            paddingTop: 'unset',
            letterSpacing: 'normal',
            fontSize: '1.8em',
            fontWeight: '700',
            color: 'initial',
            height: 'auto',
            lineHeight: 'initial',
            flex: 'initial'

        }
        const appLogoInnerStyle = {
            display: 'flex',
            paddingLeft: '0px',
            paddingRight: '0',
            margin: '20px 0 0 18px',
            width: 'auto'
        }
        return (
            <div className={classes}>
                <Drawer
                    containerStyle={{backgroundImage: 'linear-gradient(142deg,#00041a,#00126b)'}}
                    docked
                    open={open}
                    onClose={this.handleClose}>
                    <AppBar showMenuIconButton={false} title={<Logo/>} titleStyle={style['appbar-logo']}
                            titleStyle={appLogoTitleStyle} style={appLogoInnerStyle} className={style.appbar}/>
                    <div style={{
                        marginTop: '45px', paddingLeft: '9px', width: '100%', height: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                    }}>

                        <List>
                            {listItemData.map((listItem) => {
                                return (
                                    <ListItem key={listItem.key}
                                              innerDivStyle={{color: 'white', fontFamily: 'Bai Jamjuree'}}
                                              primaryText={listItem.primaryText}
                                              onClick={listItem.navigateTo ? () => this.apiClick(`/${listItem.navigateTo}`) : undefined}
                                              leftIcon={<FontAwesomeIcon className={style.icon} icon={listItem.icon}/>}
                                              initiallyOpen={false}
                                              primaryTogglesNestedList
                                              className={url.includes(listItem.navigateTo) ? style['menu-selected'] : undefined}
                                              nestedItems={listItem.nestedItems &&
                                              listItem.nestedItems.map((nestedItem) => {
                                                  return (
                                                      <ListItem key={'nestedItems_' + nestedItem.key}
                                                                nestedListStyle={{color: 'white'}}
                                                                innerDivStyle={{color: 'white', fontSize: '.9em'}}
                                                          // className={url.includes(nestedItem.navigateTo) ? style['menu-selected'] : undefined}
                                                                primaryText={nestedItem.primaryText}
                                                                onClick={nestedItem.linkUrl ? () => window.open(nestedItem.linkUrl, '_blank') : () => this.apiClick(`/${nestedItem.navigateTo}`)}
                                                                iconStyle={{fontSize: '5px'}}
                                                                leftIcon={nestedItem.icon &&
                                                                <FontAwesomeIcon size={'xs'} className={style.icon}
                                                                                 icon={nestedItem.icon} fixedWidth/>}

                                                      />
                                                  )
                                              })}
                                    />
                                )
                            })}
                        </List>
                    </div>
                    <div style={{color: '#c2c2c28f',display:'flex',justifyContent:'center'}}>v{VERSION}</div>
                </Drawer>
                <AppBar
                    // title={<span style={{ cursor: 'default' }}><img width={'50px'} height={'50px'} src={Logo} alt={'Mickey'}/>Predator</span>}
                    style={{backgroundImage: 'linear-gradient(142deg,#00041a,#00126b)', flexShrink: 0}}
                    // onTitleClick={() => {
                    //   history.push('/last_reports')
                    // }}
                    // iconElementRight={rightIcon}
                    onLeftIconButtonClick={this.handleToggle}
                />
                {this.props.children ? this.props.children : null}
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        url: state.router.location.pathname
    }
}

export default connect(mapStateToProps)(DrawerE);
