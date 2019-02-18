import React from 'react';

import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';

const AddButton = (props) => {
  const { title, onClick, disabled } = props;
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
      <div>
        <FloatingActionButton disabled={disabled} onClick={onClick} mini>
          <ContentAdd />
        </FloatingActionButton>
      </div>
      {title}
    </div>
  )
};

export default AddButton;
