import { all } from 'redux-saga/effects';
import { testsRegister } from '../features/redux/saga/testsSagas';
import { reportsRegister } from '../features/redux/saga/reportsSagas';
import { jobsRegister } from '../features/redux/saga/jobsSagas';
import { configRegister } from '../features/redux/saga/configSagas';

export default function * rootSaga () {
  yield all([
    testsRegister(),
    reportsRegister(),
    jobsRegister(),
    configRegister()
  ]);
}
