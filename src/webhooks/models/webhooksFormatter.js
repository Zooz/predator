const cloneDeep = require('lodash/cloneDeep');
const slackEmojis = require('slack-emojis');

const {
    EVENT_FORMAT_TYPE_JSON,
    EVENT_FORMAT_TYPE_SLACK,
    EVENT_FORMAT_TYPE_TEAMS,
    WEBHOOK_EVENT_TYPES,
    WEBHOOK_EVENT_TYPE_STARTED,
    WEBHOOK_EVENT_TYPE_FINISHED,
    WEBHOOK_EVENT_TYPE_FAILED,
    WEBHOOK_EVENT_TYPE_API_FAILURE,
    WEBHOOK_EVENT_TYPE_ABORTED,
    WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED,
    WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED,
    WEBHOOK_SLACK_DEFAULT_MESSAGE_ICON,
    WEBHOOK_SLACK_DEFAULT_REPORTER_NAME,
    WEBHOOK_EVENT_TYPE_IN_PROGRESS,
    WEBHOOK_TEAMS_DEFAULT_THEME_COLOR
} = require('../../common/consts');
const statsFormatter = require('./statsFormatter');

function unknownWebhookEventTypeError(badWebhookEventTypeValue) {
    return new Error(`Unrecognized webhook event: ${badWebhookEventTypeValue}, must be one of the following: ${WEBHOOK_EVENT_TYPES.join(', ')}`);
}

function getThresholdSlackMessage(state, { testName, benchmarkThreshold, lastScores, aggregatedReport, score }) {
    let resultText = 'above';
    let icon = slackEmojis.ROCKET;
    if (state === WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED) {
        resultText = 'below';
        icon = slackEmojis.CRY;
    }
    return `${icon} *Test ${testName} got a score of ${score.toFixed(1)}` +
        ` this is ${resultText} the threshold of ${benchmarkThreshold}. ${lastScores.length > 0 ? `last 3 scores are: ${lastScores.join()}` : 'no last score to show'}` +
        `.*\n${statsFormatter.getStatsFormatted('aggregate', aggregatedReport, { score })}\n`;
}

function slackWebhookFormat(message, options) {
    return {
        text: message,
        icon_emoji: options.icon || WEBHOOK_SLACK_DEFAULT_MESSAGE_ICON,
        username: WEBHOOK_SLACK_DEFAULT_REPORTER_NAME
    };
}

function getThresholdTeamsSummary(state, { testName, score }) {
    let icon = '&#x1F680;';
    if (state === WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED) {
        icon = '&#x1F622;';
    }
    return `${icon} *Test ${testName} got a score of ${score.toFixed(1)}`;
}

function getThresholdTeamsSubtitle(state, { benchmarkThreshold, lastScores, aggregatedReport, score }) {
    let resultText = 'above';
    if (state === WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED) {
        resultText = 'below';
    }
    return `this is ${resultText} the threshold of ${benchmarkThreshold}. ${lastScores.length > 0 ? `last 3 scores are: ${lastScores.join()}` : 'no last score to show'}` +
        `.*\n${statsFormatter.getStatsFormatted('aggregate', aggregatedReport, { score })}\n`;
}

function teamsWebhookFormat(title, subtitle, options) {
    return {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        'summary': 'Predator Notification',
        themeColor: WEBHOOK_TEAMS_DEFAULT_THEME_COLOR,
        sections: [
            {
                activityTitle: `![Mikey](https://assets.website-files.com/5ceb9d8c5d0f4725dca04998/5cf3af2d6e00f5d87f38869e_mickey-clean.png)${title}`,
                text: `${subtitle}`,
                activityImage: 'https://assets.website-files.com/5ceb9d8c5d0f4725dca04998/5cf3af2d6e00f5d87f38869e_mickey-clean.png',
                markdown: true
            }
        ]
    };
}

function json(event, testId, jobId, report, additionalInfo, options) {
    const payload = {
        test_id: testId,
        job_id: jobId,
        event: event,
        additional_details: {
            ...cloneDeep({ report, ...additionalInfo })
        }
    };
    return payload;
}

function slack(event, testId, jobId, report, additionalInfo, options) {
    let message = null;
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

            message = `🤓 *Test ${testName} with id: ${testId} has started*.\n
            *test configuration:* environment: ${environment} duration: ${duration} seconds, ${requestRateMessage}, number of runners: ${parallelism}`;
            break;
        }
        case WEBHOOK_EVENT_TYPE_FINISHED: {
            message = `😎 *Test ${testName} with id: ${testId} is finished.*\n ${statsFormatter.getStatsFormatted('aggregate', aggregatedReport, reportBenchmark)}\n`;
            if (grafanaReport) {
                message += `<${grafanaReport} | View final grafana dashboard report>`;
            }
            break;
        }
        case WEBHOOK_EVENT_TYPE_FAILED: {
            message = `😞 *Test with id: ${testId} Failed*.\n
            test configuration:\n
            environment: ${environment}\n
            ${stats.data}`;
            break;
        }
        case WEBHOOK_EVENT_TYPE_ABORTED: {
            message = `😢 *Test ${testName} with id: ${testId} was aborted.*\n`;
            break;
        }
        case WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED:
        case WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED: {
            message = getThresholdSlackMessage(event, { testName, lastScores, aggregatedReport, benchmarkThreshold, score });
            break;
        }
        case WEBHOOK_EVENT_TYPE_IN_PROGRESS: {
            message = `${slackEmojis.HAMMER_AND_WRENCH} *Test ${testName} with id: ${testId} is in progress!*`;
            break;
        }
        case WEBHOOK_EVENT_TYPE_API_FAILURE: {
            message = `${slackEmojis.BOOM} *Test ${testName} with id: ${testId} has encountered an API failure!* ${slackEmojis.SKULL}`;
            break;
        }
        default: {
            throw unknownWebhookEventTypeError();
        }
    }
    return slackWebhookFormat(message, options);
}

function teams(event, testId, jobId, report, additionalInfo, options) {
    let title = null;
    let subtitle = '';
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

            title = `&#x1F603; *Test ${testName} with id: ${testId} has started*.`;
            subtitle = `*test configuration:* environment: ${environment} duration: ${duration} seconds, ${requestRateMessage}, number of runners: ${parallelism}`;
            break;
        }
        case WEBHOOK_EVENT_TYPE_FINISHED: {
            title = `&#x1F60E; *Test ${testName} with id: ${testId} is finished.*`;
            subtitle = `${statsFormatter.getStatsFormatted('aggregate', aggregatedReport, reportBenchmark)}\n`;
            if (grafanaReport) {
                subtitle += `<${grafanaReport} | View final grafana dashboard report>`;
            }
            break;
        }
        case WEBHOOK_EVENT_TYPE_FAILED: {
            title = `&#x1F627; *Test with id: ${testId} Failed*.`;
            subtitle = `test configuration:\n
            environment: ${environment}\n
            ${stats.data}`;
            break;
        }
        case WEBHOOK_EVENT_TYPE_ABORTED: {
            title = `&#x1F622; *Test ${testName} with id: ${testId} was aborted.*`;
            break;
        }
        case WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED:
        case WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED: {
            title = getThresholdTeamsSummary(event, { testName, score });
            subtitle = getThresholdTeamsSubtitle(event, { lastScores, aggregatedReport, benchmarkThreshold, score });
            break;
        }
        case WEBHOOK_EVENT_TYPE_IN_PROGRESS: {
            title = `&#x1F528; *Test ${testName} with id: ${testId} is in progress!*`;
            break;
        }
        case WEBHOOK_EVENT_TYPE_API_FAILURE: {
            title = `&#x1F525; *Test ${testName} with id: ${testId} has encountered an API failure!* &#x1F480;`;
            break;
        }
        default: {
            throw unknownWebhookEventTypeError();
        }
    }
    return teamsWebhookFormat(title, subtitle, options);
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
        default: {
            throw new Error(`Unrecognized webhook format: ${format}, available options: ${[EVENT_FORMAT_TYPE_JSON, EVENT_FORMAT_TYPE_SLACK, EVENT_FORMAT_TYPE_TEAMS].join()}`);
        }
    }
};

