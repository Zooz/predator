import React, {Component} from 'react'
import {Drawer, AppBar, ListItem, List} from 'material-ui'
import style from './style.scss'
import {connect} from 'react-redux'
import RactangleAlignChildrenLeft from '../../../../components/RectangleAlign/RectangleAlignChildrenLeft';
import history from '../../../../store/history';
import logo from '../../../../images/logo.png';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';


const Logo = () => {

    return (
        <div className={style['logo-wrapper']}>
            <img width={'50px'} height={'50px'} src={logo} alt={'Mickey'}/>
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
        const { open } = this.state;
        const {url, history} = this.props;
        const classes = [style.drawer, open ? style['drawer--open'] : undefined].join(' ');
        const {listItemData} = this.props;

        return (
            <div className={classes}>
                <Drawer
                    // containerClassName={style['drawer-root']}
                    containerStyle={{backgroundImage: 'linear-gradient(142deg,#00041a,#00126b)'}}
                    docked
                    open={open}
                    onClose={this.handleClose}>
                    {/* <AppBar showMenuIconButton={false} className={style.appbar}/> */}
                    <div style={{marginTop: '45px', paddingLeft: '9px', width: '100%'}}>
                        <Logo/>
                        <List>
                            {listItemData.map((listItem) => {
                                return (
                                    <ListItem key={listItem.key}
                                              innerDivStyle={{color: 'white'}}
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
                                                                innerDivStyle={{color: 'white'}}
                                                                // className={url.includes(nestedItem.navigateTo) ? style['menu-selected'] : undefined}
                                                                primaryText={nestedItem.primaryText}
                                                                onClick={nestedItem.linkUrl ? () => window.open(nestedItem.linkUrl, '_blank') : () => this.apiClick(`/${nestedItem.navigateTo}`)}
                                                          // leftIcon={<ActionGrade />}
                                                      />
                                                  )
                                              })}
                                    />
                                )
                            })}
                        </List>
                    </div>
                </Drawer>
                <AppBar
                // title={<span style={{ cursor: 'default' }}><img width={'50px'} height={'50px'} src={Logo} alt={'Mickey'}/>Predator</span>}
                style={{ backgroundImage: 'linear-gradient(142deg,#00041a,#00126b)', flexShrink: 0 }}
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
