const cloneDeep = require('lodash/cloneDeep');
const emojiHandler = require('../../common/emojiHandler');

const {
    EVENT_FORMAT_TYPES,
    EVENT_FORMAT_TYPE_JSON,
    EVENT_FORMAT_TYPE_SLACK,
    EVENT_FORMAT_TYPE_TEAMS,
    EVENT_FORMAT_TYPE_DISCORD,
    WEBHOOK_GRAVATAR_URL,
    WEBHOOK_EVENT_TYPES,
    WEBHOOK_EVENT_TYPE_STARTED,
    WEBHOOK_EVENT_TYPE_FINISHED,
    WEBHOOK_EVENT_TYPE_FAILED,
    WEBHOOK_EVENT_TYPE_API_FAILURE,
    WEBHOOK_EVENT_TYPE_ABORTED,
    WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED,
    WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED,
    WEBHOOK_SLACK_DEFAULT_MESSAGE_ICON,
    WEBHOOK_DEFAULT_REPORTER_NAME,
    WEBHOOK_EVENT_TYPE_IN_PROGRESS,
    WEBHOOK_TEAMS_DEFAULT_THEME_COLOR,
    WEBHOOK_TEST_MESSAGE
} = require('../../common/consts');
const statsFormatter = require('./statsFormatter');

function getGravatarUrlWithIconSize(size) {
    return `${WEBHOOK_GRAVATAR_URL}?s=${size}`;
}

function unknownWebhookEventTypeError(badWebhookEventTypeValue) {
    return new Error(`Unrecognized webhook event: ${badWebhookEventTypeValue}, must be one of the following: ${WEBHOOK_EVENT_TYPES.join(', ')}`);
}

function getThresholdMessage(state, { emoji, testName, benchmarkThreshold, lastScores, aggregatedReport, score }) {
    let resultText = 'above';
    let icon = null;
    icon = emoji.ROCKET;
    if (state === WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED) {
        resultText = 'below';
        icon = emoji.CRY;
    }
    return `${icon} *Test ${testName} got a score of ${score.toFixed(1)}` +
        ` this is ${resultText} the threshold of ${benchmarkThreshold}. ${lastScores.length > 0 ? `last 3 scores are: ${lastScores.join()}` : 'no last score to show'}` +
        `.*\n${statsFormatter.getStatsFormatted('aggregate', aggregatedReport, { score })}\n`;
}

function slackWebhookFormat(message, options = {}) {
    return {
        text: message,
        icon_emoji: options.icon || WEBHOOK_SLACK_DEFAULT_MESSAGE_ICON,
        username: WEBHOOK_DEFAULT_REPORTER_NAME
    };
}

function teamsWebhookFormat(message) {
    return {
        themeColor: WEBHOOK_TEAMS_DEFAULT_THEME_COLOR,
        text: message.replace(/\n/g, '   \n')
    };
}

function discordWebhookFormat(message) {
    return {
        content: message,
        username: WEBHOOK_DEFAULT_REPORTER_NAME,
        avatar_url: getGravatarUrlWithIconSize(128)
    };
}

function json(event, testId, jobId, report, additionalInfo, options) {
    return {
        test_id: testId,
        job_id: jobId,
        event: event,
        additional_details: {
            ...cloneDeep({report, ...additionalInfo})
        }
    };
}

function switcher(report, additionalInfo, event, testId, emoji) {
    const {
        environment,
        duration,
        parallelism = 1,
        ramp_to: rampTo,
        arrival_rate: arrivalRate,
        arrival_count: arrivalCount,
        test_name: testName,
        grafana_report: grafanaReport
    } = report;
    const { score, aggregatedReport, reportBenchmark, benchmarkThreshold, lastScores, stats } = additionalInfo;

    switch (event) {
        case WEBHOOK_EVENT_TYPE_STARTED: {
            const rampToMessage = `, ramp to: ${rampTo} scenarios per second`;
            let requestRateMessage = arrivalRate ? `arrival rate: ${arrivalRate} scenarios per second` : `arrival count: ${arrivalCount} scenarios`;
            requestRateMessage = rampTo ? requestRateMessage + rampToMessage : requestRateMessage;

            return `🤓 *Test ${testName} with id: ${testId} has started*.\n
            *test configuration:* environment: ${environment} duration: ${duration} seconds, ${requestRateMessage}, number of runners: ${parallelism}`;
        }
        case WEBHOOK_EVENT_TYPE_FINISHED: {
            let message = `😎 *Test ${testName} with id: ${testId} is finished.*\n ${statsFormatter.getStatsFormatted('aggregate', aggregatedReport, reportBenchmark)}\n`;
            if (grafanaReport) {
                message += `<${grafanaReport} | View final grafana dashboard report>`;
            }
            return message
        }
        case WEBHOOK_EVENT_TYPE_FAILED: {
            return `😞 *Test with id: ${testId} Failed*.\n
            test configuration:\n
            environment: ${environment}\n
            ${stats.data}`;
        }
        case WEBHOOK_EVENT_TYPE_ABORTED: {
            return `😢 *Test ${testName} with id: ${testId} was aborted.*\n`;
        }
        case WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED:
        case WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED: {
            return getThresholdMessage(event, { emoji, testName, lastScores, aggregatedReport, benchmarkThreshold, score });
        }
        case WEBHOOK_EVENT_TYPE_IN_PROGRESS: {
            return `${emoji.HAMMER_AND_WRENCH} *Test ${testName} with id: ${testId} is in progress!*`;
        }
        case WEBHOOK_EVENT_TYPE_API_FAILURE: {
            return `${emoji.BOOM} *Test ${testName} with id: ${testId} has encountered an API failure!* ${emoji.SKULL}`;
        }
        default: {
            throw unknownWebhookEventTypeError();
        }
    }
}

function slack(event, testId, jobId, report, additionalInfo, options) {
    const emoji = emojiHandler(EVENT_FORMAT_TYPE_SLACK);
    let message = switcher(report, additionalInfo, event, testId, emoji);
    return slackWebhookFormat(message, options);
}

function teams(event, testId, jobId, report, additionalInfo, options) {
    const emoji = emojiHandler(EVENT_FORMAT_TYPE_TEAMS);
    let message = switcher(report, additionalInfo, event, testId, emoji);
    return teamsWebhookFormat(message);
}

function discord(event, testId, jobId, report, additionalInfo, options) {
    const emoji = emojiHandler(EVENT_FORMAT_TYPE_DISCORD);
    let message = switcher(report, additionalInfo, event, testId, emoji);
    return discordWebhookFormat(message);
}

module.exports.format = function(format, eventType, jobId, testId, report, additionalInfo = {}, options = {}) {
    if (!WEBHOOK_EVENT_TYPES.includes(eventType)) {
        throw unknownWebhookEventTypeError(eventType);
    }
    switch (format) {
        case EVENT_FORMAT_TYPE_SLACK: {
            return slack(eventType, testId, jobId, report, additionalInfo, options);
        }
        case EVENT_FORMAT_TYPE_JSON: {
            return json(eventType, testId, jobId, report, additionalInfo, options);
        }
        case EVENT_FORMAT_TYPE_TEAMS: {
            return teams(eventType, testId, jobId, report, additionalInfo, options);
        }
        case EVENT_FORMAT_TYPE_DISCORD:{
            return discord(eventType, testId, jobId, report, additionalInfo, options);
        }
        default: {
            throw new Error(`Unrecognized webhook format: ${format}, available options: ${EVENT_FORMAT_TYPES.join()}`);
        }
    }
};

module.exports.formatSimpleMessage = function(format) {
    const simpleMessage = WEBHOOK_TEST_MESSAGE;
    switch (format) {
        case EVENT_FORMAT_TYPE_SLACK: {
            return slackWebhookFormat(simpleMessage);
        }
        case EVENT_FORMAT_TYPE_JSON: {
            return { greeting: simpleMessage };
        }
        case EVENT_FORMAT_TYPE_TEAMS: {
            return teamsWebhookFormat(simpleMessage);
        }
        case EVENT_FORMAT_TYPE_DISCORD: {
            return discordWebhookFormat(simpleMessage);
        }
        default: {
            throw new Error(`Unrecognized webhook format: ${format}, available options: ${EVENT_FORMAT_TYPES.join()}`);
        }
    }
};
