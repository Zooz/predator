import React from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import classNames from 'classnames';
import style from '../JobForm/style.scss';

export default class InputList extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      elements: this.props.elements
    };
  }

    addNewElement = (target) => {
      let newElement = document.getElementById(`${this.props.element}_val`).value;
      this.props.onChange(newElement, target);
      this.setState({
        'elements': [...this.state['elements'], newElement]
      })
    };

    render () {
      const helpClass = classNames('material-icons');
      return (
        <div>
          <TextField floatingLabelText={'New ' + this.props.element} id={`${this.props.element}_val`} />
          <RaisedButton className={this.props.element === 'Email' ? style.EmailInputListToolTip : style.WebhookInputListToolTip} id={this.props.id} primary onClick={this.addNewElement} label={`+ ${this.props.element}`} />
          <br />
          <b>{this.props.title}</b>
          <List component='nav'>
            {
              this.state.elements.map((element, index) => {
                return (
                  <ListItem key={index}>
                    <ListItemText
                      primary={element}
                    />
                  </ListItem>
                )
              })
            }
          </List>
        </div>
      );
    }
}
