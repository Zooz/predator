import logo from '../../images/logo.png';
import React, { useEffect, useState, useCallback } from 'react';

const MickeyLoading = ({ style = {}, statuses = [], timeInSec = 45, passedTime = 0, maxValueUntilFastFinish = 90, fastFinish = false, onFinish }) => {
  const [stepBase, setStepBase] = useState(0)
  const [value, setValue] = useState(Math.min(Math.round(passedTime * 100 / 45), 100));
  const incValue = useCallback((add) => {
    const newValue = value + add;
    setValue(Math.round(newValue));
  }, [value]);
  const status = stepBase ? statuses[Math.max(Math.trunc(value / stepBase) - 1, 0)] : undefined;

  useEffect(() => {
    if (statuses.length > 0) {
      setStepBase(maxValueUntilFastFinish / statuses.length);
    }
  }, [statuses, statuses.length])

  useEffect(() => {
    const updatedTimeMills = 500;
    const time = fastFinish ? 3 : timeInSec;
    const add = fastFinish ? 5 : updatedTimeMills * 100 / (time * 1000);

    if (value >= 100) {
      setTimeout(() => {
        onFinish()
      }, 1000);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (value === maxValueUntilFastFinish && !fastFinish) {
        return;
      }
      const maxValue = fastFinish ? 100 : maxValueUntilFastFinish;

      if (value + add > maxValue) {
        incValue(maxValue - value);
      } else {
        incValue(add)
      }
    }, updatedTimeMills);

    return () => {
      clearTimeout(timeoutId);
    }
  }, [incValue, timeInSec, fastFinish]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', ...style }}>
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
      {status && <div style={{ alignSelf: 'center', marginTop: '10px' }}>{status}</div>}
    </div>
  )
}

export default MickeyLoading;
