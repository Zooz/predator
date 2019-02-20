import React, { Component } from 'react'
import { Drawer, AppBar, ListItem, List } from 'material-ui'
import style from './style.scss'
import { connect } from 'react-redux'
import ActionGrade from 'material-ui/svg-icons/action/grade';
import ContentInbox from 'material-ui/svg-icons/content/inbox';
import RactangleAlignChildrenLeft from '../../../../components/RectangleAlign/RectangleAlignChildrenLeft';
import history from '../../../../store/history';
import Logo from '../../../../images/logo.png';


class DrawerE extends Component {
  constructor (props) {
    super(props);

    this.state = { open: props.open };
    this.listItemData = props.listItemData;
  }

    handleToggle = () => {
      this.setState({ open: !this.state.open });
    };

    handleClose = () => {
      this.setState({ open: false });
    };

    apiClick = (navigateTo) => {
      history.push(navigateTo);
    };

    render () {
      const { open } = this.state;
      const { url, history } = this.props;
      const classes = [style.drawer, open ? style['drawer--open'] : undefined].join(' ');

      return (
        <div className={classes}>
          <Drawer
            containerStyle={{ backgroundImage: 'linear-gradient(142deg,#00041a,#00126b)' }}
            docked
            open={open}
            onClose={this.handleClose}>
            {/* <AppBar showMenuIconButton={false} className={style.appbar}/> */}

            <List>
              {this.listItemData.map((listItem) => {
                return (
                  <ListItem key={listItem.key}
                    innerDivStyle={{ color: 'white' }}
                    primaryText={listItem.primaryText}
                    leftIcon={<ContentInbox />}
                    initiallyOpen={false}
                    primaryTogglesNestedList
                    nestedItems={
                      listItem.nestedItems.map((nestedItem) => {
                        if (nestedItem.linkUrl) {
                          return (
                            <a key={nestedItem.key} target='_blank' href={nestedItem.linkUrl}>
                              <ListItem key={'nestedItems_' + nestedItem.key}
                                nestedListStyle={{ color: 'white' }}
                                innerDivStyle={{ color: 'white' }}
                                className={url.includes(nestedItem.navigateTo) ? style['menu-selected'] : undefined}
                                primaryText={nestedItem.primaryText}
                                leftIcon={<ActionGrade />} />
                            </a>
                          )
                        } else {
                          return (
                            <ListItem key={'nestedItems_' + nestedItem.key}
                              innerDivStyle={{ color: 'white' }}
                              className={url.includes(nestedItem.navigateTo) ? style['menu-selected'] : undefined}
                              primaryText={nestedItem.primaryText}
                              onClick={() => this.apiClick(`/${nestedItem.navigateTo}`)}
                              leftIcon={<ActionGrade />} />
                          )
                        }
                      })
                    } />
                )
              })}
            </List>

          </Drawer>
          <AppBar
            title={<span style={{ cursor: 'default' }}><img width={'50px'} height={'50px'} src={Logo} alt={'Mickey'}/>Predator</span>}
            style={{ backgroundImage: 'linear-gradient(142deg,#00041a,#00126b)', flexShrink: 0 }}
            onTitleClick={() => {
              history.push('/last_reports')
            }}
            // iconElementRight={rightIcon}
            onLeftIconButtonClick={this.handleToggle} />
          {this.props.children ? this.props.children : null}
        </div>
      );
    }
}

function mapStateToProps (state) {
  return {
    url: state.router.location.pathname
  }
}

export default connect(mapStateToProps)(DrawerE);
