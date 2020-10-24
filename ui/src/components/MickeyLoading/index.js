import logo from '../../images/logo.png';
import React, { useEffect, useState, useCallback } from 'react';

const MickeyLoading = ({ timeInSec = 45, fastFinish, onFinish }) => {
  const [value, setValue] = useState(0);
  const incValue = useCallback((add) => {
    const newValue = value + add;
    setValue(Math.round(newValue));
  }, [value]);

  useEffect(() => {
    const updatedTimeMills = 500;
    const time = fastFinish ? 3 : timeInSec;
    const add = fastFinish ? 5 : updatedTimeMills * 100 / (time * 1000);

    if (value >= 100) {
      return onFinish();
    }

    const timeoutId = setTimeout(function () {
      if (value + add > 100) {
        incValue(100 - value);
      } else {
        incValue(add)
      }
    }, updatedTimeMills);

    return () => {
      clearTimeout(timeoutId);
    }
  }, [incValue, timeInSec, fastFinish]);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      {/* <div>manor</div> */}
      <div style={{
        flex: 1,
        backgroundColor: 'white',
        borderRadius: '20px',
        marginRight: '5px'
      }}>
        <div style={{ backgroundColor: 'green', display: 'flex', borderRadius: '20px', justifyContent: 'flex-end', minWidth: '40px', transition: 'width 1s', width: `${value}%` }}>
          <img width={'40px'} src={logo} alt={'Mickey'} />
        </div>

      </div>
      <div style={{ alignSelf: 'center', width: '40px' }}>{value}%</div>

    </div>
  )
}

export default MickeyLoading;
