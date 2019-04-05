import * as Types from '../types/auth';

export const addToken = (token) => (
  { type: Types.ADD_TOKEN, token }
);
