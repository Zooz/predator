import { all } from 'redux-saga/effects';
import { testsRegister } from '../features/redux/saga/testsSagas';
import { processorsRegister } from '../features/redux/saga/processorsSagas';
import { chaosExperimentsRegister } from '../features/redux/saga/chaosExperimentsSagas';
import { reportsRegister } from '../features/redux/saga/reportsSagas';
import { jobsRegister } from '../features/redux/saga/jobsSagas';
import { configRegister } from '../features/redux/saga/configSagas';
import { webhooksRegister } from '../features/redux/saga/webhooksSagas';

export default function * rootSaga () {
  yield all([
    processorsRegister(),
    chaosExperimentsRegister(),
    testsRegister(),
    reportsRegister(),
    jobsRegister(),
    configRegister(),
    webhooksRegister()
  ]);
}
