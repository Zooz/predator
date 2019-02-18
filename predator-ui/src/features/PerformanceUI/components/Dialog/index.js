import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import JSONPretty from 'react-json-pretty';
import Loader from '../Loader'

export default class DialogExampleSimple extends React.Component {
  render () {
    const actions = [
      <FlatButton
        label='Cancel'
        primary
        onClick={this.props.closeDialog}
      />
    ];

    return (
      <Dialog
        title={this.props.data ? this.props.data[this.props.title_key] : 'None'}
        actions={actions}
        modal={false}
        open
        autoScrollBodyContent
        onRequestClose={this.handleClose}>
        {this.props.data ? <JSONPretty id='json-pretty' json={this.props.data} /> : <Loader />}
      </Dialog>
    );
  }
}
