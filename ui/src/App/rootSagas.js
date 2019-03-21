import { all } from 'redux-saga/effects';
import { testsRegister } from '../features/PerformanceUI/instance/redux/saga/testsSagas';
import { reportsRegister } from '../features/PerformanceUI/instance/redux/saga/reportsSagas';
import { jobsRegister } from '../features/PerformanceUI/instance/redux/saga/jobsSagas';
import { configRegister } from '../features/PerformanceUI/instance/redux/saga/configSagas';

export default function * rootSaga () {
  yield all([
    testsRegister(),
    reportsRegister(),
    jobsRegister(),
    configRegister()
  ]);
}
