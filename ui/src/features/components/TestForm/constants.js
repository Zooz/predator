export const CONTENT_TYPES = {
    APPLICATION_JSON: 'json',
    FORM: 'x-www-form-urlencoded',
    FORM_DATA: 'form-data',
    OTHER: 'raw',
    XML: 'xml',
    NONE: 'none',
};
export const CAPTURE_TYPES = {
    XPATH: 'XPath',
    JSON_PATH: 'JSONPath',
    REGEXP: 'Regexp',
    HEADER: 'Header'
};

export const CAPTURE_KEY_VALUE_PLACEHOLDER = {
    XPath: {
        key: '/id',
        value: 'id'
    },
    JSONPath: {
        key: '$.id',
        value: 'id'
    },
    [CAPTURE_TYPES.REGEXP]: {
        key: '/id',
        value: 'id'
    },
    [CAPTURE_TYPES.HEADER]: {
        key: 'header-name',
        value: 'id'
    },
};
export const CAPTURE_TYPE_TO_REQUEST = {
    [CAPTURE_TYPES.XPATH]: 'xpath',
    [CAPTURE_TYPES.JSON_PATH]: 'json',
    [CAPTURE_TYPES.HEADER]: 'header',
    [CAPTURE_TYPES.REGEXP]: 'regexp',

};
export const CAPTURE_RES_TYPE_TO_CAPTURE_TYPE = {
    json: CAPTURE_TYPES.JSON_PATH,
    xpath: CAPTURE_TYPES.XPATH,
    header: CAPTURE_TYPES.HEADER,
    regexp: CAPTURE_TYPES.REGEXP
};
export const SUPPORTED_CONTENT_TYPES = [CONTENT_TYPES.NONE, CONTENT_TYPES.FORM_DATA, CONTENT_TYPES.FORM, CONTENT_TYPES.APPLICATION_JSON, CONTENT_TYPES.OTHER];
export const SUPPORTED_CAPTURE_TYPES = [CAPTURE_TYPES.JSON_PATH, CAPTURE_TYPES.XPATH, CAPTURE_TYPES.REGEXP, CAPTURE_TYPES.HEADER];
export const HTTP_METHODS = ['POST', 'GET', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'CONNECT', 'TRACE'];
