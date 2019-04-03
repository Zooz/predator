import Immutable from 'immutable';
import * as Types from '../types/auth'
import queryString from "query-string";
import history from "../../../../../store/history";

const token = queryString.parse(history.location.search).token || localStorage.token;

const initialState = Immutable.Map({
  token: token
});

export default function reduce (state = initialState, action = {}) {
  switch (action.type) {
  case Types.ADD_TOKEN:
    return state.set('token', action.token);
  default:
    return state;
  }
}
