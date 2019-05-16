import React from 'react';
import RefreshIndicator from 'material-ui/RefreshIndicator';

const style = {
  container: {
    position: 'relative',
    textAlign: 'center'
  },
  refresh: {
    display: 'inline-block',
    position: 'relative'
  }
};

const RefreshIndicatorExampleLoading = () => (
  <div style={style.container}>
    <RefreshIndicator
      size={50}
      left={0}
      top={0}
      loadingColor='#FF9800'
      status='loading'
      style={style.refresh}
    />
  </div>
);

export default RefreshIndicatorExampleLoading;
