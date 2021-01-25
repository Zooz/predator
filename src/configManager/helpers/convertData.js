const logger = require('../../common/logger');

module.exports.convertByType = (valueToConvert, type) => {
    let value = valueToConvert;
    try {
        if (definedOrEmptyString(valueToConvert) && type) {
            switch (type) {
                case 'json':
                    value = JSON.parse(valueToConvert);
                    break;
                case 'int':
                    value = isNaN(valueToConvert) ? handleParseError(valueToConvert, type) : parseInt(valueToConvert);
                    break;
                case 'float':
                    value = isNaN(valueToConvert) ? handleParseError(valueToConvert, type) : parseFloat(valueToConvert);
                    break;
                case 'boolean':
                    value = valueToConvert === 'true' || valueToConvert === true;
                    break;
                case 'array':
                    value = Array.isArray(valueToConvert) ? valueToConvert : valueToConvert.split(',');
                    value = !isEmptyArray(value) ? value : undefined;
                    break;
            }
        }
    } catch (err) {
        value = handleParseError(valueToConvert, type);
    }
    return value;
};

function handleParseError(value, type) {
    logger.error('Failed to convert value : ' + value + 'to type: ' + type);
    return undefined;
}

function definedOrEmptyString(value) {
    return value || value === '';
}

function isEmptyArray(value) {
    return value.length === 0 || (value.length === 1 && value[0] === '');
}