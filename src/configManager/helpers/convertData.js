const logger = require('../../common/logger');

module.exports.convertByType = (valueToConvert, type) => {
    let value = valueToConvert;
    try {
        if (valueToConvert && type) {
            switch (type) {
            case 'json':
                value = JSON.parse(valueToConvert);
                break;
            case 'int':
                value = isNaN(valueToConvert) ? handleParseError(valueToConvert, type) : parseInt(valueToConvert);
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
