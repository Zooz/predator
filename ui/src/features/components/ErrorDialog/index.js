import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import { OK_BUTTON_MESSAGE, EMPTY_STRING, ERROR_TITLE } from '../../../constants';

export default (props) => {
  const { closeDialog, showMessage } = props;
  const actions = [
    <FlatButton
      label={OK_BUTTON_MESSAGE}
      primary
      onClick={closeDialog}
    />
  ];
  if (!showMessage) {
    return null;
  }
  return (
    <Dialog
      title={ERROR_TITLE}
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
  return EMPTY_STRING + message;
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
