import React from 'react';
import Dialog from 'material-ui/Dialog';
import JobForm from '../JobForm';

export default class DialogExampleSimple extends React.Component {
  render () {
    return (
      <Dialog bodyStyle={{ overflow: 'auto' }}
        title={this.props.title}
        modal={false}
        open
        onRequestClose={this.handleClose}
      >
        <JobForm data={this.props.data} instance={this.props.instance} history={this.props.history} onCancel={this.props.closeDialog} successfulClose={this.props.successfulClose}
        />
      </Dialog>
    );
  }
}
