const { EVENT_FORMAT_TYPE_JSON, EVENT_FORMAT_TYPE_SLACK } = require('../../common/consts');

function json(payload) {
    return payload;
}

function slack(payload) {
    // TODO: make it slacky
}

module.exports = {
    [EVENT_FORMAT_TYPE_JSON]: json,
    [EVENT_FORMAT_TYPE_SLACK]: slack
};
