import React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import { ERROR_TITLE, CLOSE_BUTTON_MESSAGE, EMPTY_STRING } from "../../../../constants/constants";

export default (props) => {
  const { onClose, message } = props;
  const actions = [
    <FlatButton
      label={CLOSE_BUTTON_MESSAGE}
      primary
      onClick={onClose}
    />
  ];

  return (
    <Dialog
      title={ERROR_TITLE}
      actions={actions}
      modal={false}
      open
      autoScrollBodyContent
    >
      { message? EMPTY_STRING + message : EMPTY_STRING }

    </Dialog>
  )
}