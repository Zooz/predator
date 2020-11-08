import { URL_WITH_PROTOCOL_REGEX } from '../constants';

const URL_FIELDS = {
  BASE: 'baseUrl',
  STEP: 'step'
};

const isUrlValid = (url) => {
  return URL_WITH_PROTOCOL_REGEX.test(url);
};

export {
  isUrlValid,
  URL_FIELDS
}
