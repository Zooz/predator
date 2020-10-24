import { URL_WITH_PROTOCOL_REGEX } from "../../constants/constants";

const URL_FIELDS = {
  BASE: "base",
  STEP: "step",
};

const isUrlValid = (url) => {
  if (URL_WITH_PROTOCOL_REGEX.test(url)) {
    return true;
  }
  return false;
};

export {
  isUrlValid,
  URL_FIELDS,
}