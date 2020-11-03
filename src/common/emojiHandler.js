const slackEmojis = require('slack-emojis');
const teamsEmojis = require('./teams-emojis');

const {
    EVENT_FORMAT_TYPES,
    EVENT_FORMAT_TYPE_SLACK,
    EVENT_FORMAT_TYPE_TEAMS,
    EVENT_FORMAT_TYPE_DISCORD
} = require('./consts');

module.exports = function(format){
    switch (format) {
        case EVENT_FORMAT_TYPE_SLACK: {
            return slackEmojis;
        }
        case EVENT_FORMAT_TYPE_TEAMS: {
            return teamsEmojis;
        }
        case EVENT_FORMAT_TYPE_DISCORD:{
            return slackEmojis;
        }
        default: {
            throw new Error(`Unrecognized webhook format: ${format}, available options: ${EVENT_FORMAT_TYPES.join()}`);
        }
    }
};
