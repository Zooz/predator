import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';

export default class DialogExampleSimple extends React.Component {
  render () {
    const actions = [
      <FlatButton
        label='Cancel'
        primary
        onClick={this.props.onCancel}
      />,
      <FlatButton
        label='Submit'
        primary
        disabled={this.props.errorOnDelete || this.props.loader}
        onClick={this.props.onSubmit}
      />
    ];
    return (
      <div>
        <Dialog
          title={this.props.errorOnDelete ? this.props.errorOnDelete : `Are you sure you want to delete ${this.props.display}?`}
          actions={actions}
          modal={false}
          open
          onRequestClose={this.handleClose}
        >
          {this.props.errorOnDelete ? 'Please click cancel to go back.' : ''}
        </Dialog>
      </div>
    );
  }
}
