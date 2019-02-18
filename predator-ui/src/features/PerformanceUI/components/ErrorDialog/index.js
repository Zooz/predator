import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';

export default (props) => {
  const { closeDialog, showMessage } = props;
  const actions = [
    <FlatButton
      label='OK'
      primary
      onClick={closeDialog}
    />
  ];
  if (!showMessage) {
    return null;
  }
  return (
    <Dialog
      title={'Error'}
      actions={actions}
      modal={false}
      open
      autoScrollBodyContent
    >
      {displayError(showMessage)}
      <br />
      {showMessage.response && showMessage.response.data ? displayDescription(showMessage) : ''}
    </Dialog>
  )
}

const displayError = (message) => {
  return '' + message;
};

const displayDescription = (message) => {
  return (
    <div>
      <b>Description:</b> {message.response.data.message}
      <br />
      <b>More info:</b> {message.response.data.validation_errors}
    </div>
  );
};
