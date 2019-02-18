import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import createSagaMiddleware from 'redux-saga'
import reducers from './reducers';
import { routerReducer, routerMiddleware } from 'react-router-redux'
import history from './history'
import rootSaga from '../App/rootSagas';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const sagaMiddleware = createSagaMiddleware();

const store = createStore(combineReducers({
  ...reducers,
  router: routerReducer
}),
composeEnhancers(applyMiddleware(sagaMiddleware, routerMiddleware(history))));

sagaMiddleware.run(rootSaga);

export default store
