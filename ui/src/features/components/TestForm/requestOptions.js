
import React from 'react';

import Toggle from 'material-ui/Toggle';

export default (props) => {
  const { gzipValue, foreverValue, onGzipToggleChanged, onForeverToggleChanged } = props;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div>
        <Toggle
          label='gzip'
          labelPosition='left'
          toggled={!!gzipValue}
          onToggle={(event, value) => onGzipToggleChanged(value)}
        />
      </div>
      <div>
        <Toggle
          label='forever'
          labelPosition='left'
          toggled={!!foreverValue}
          onToggle={(event, value) => onForeverToggleChanged(value)}
        />
      </div>

    </div>

  )
}
