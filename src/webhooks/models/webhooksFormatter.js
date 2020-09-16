const cloneDeep = require('lodash/cloneDeep');

const {
    EVENT_FORMAT_TYPE_JSON,
    EVENT_FORMAT_TYPE_SLACK,
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
    WEBHOOK_EVENT_TYPE_IN_PROGRESS
} = require('../../common/consts');
const statsFormatter = require('./statsFormatter');

function unknownWebhookEventTypeError(badWebhookEventTypeValue) {
    return new Error(`Unrecognized webhook event: ${badWebhookEventTypeValue}, must be one of the following: ${WEBHOOK_EVENT_TYPES.join(', ')}`);
}

function getThresholdSlackMessage(state, { testName, benchmarkThreshold, lastScores, aggregatedReport, score }) {
    let resultText = 'above';
    let icon = ':rocket:';
    if (state === WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED) {
        resultText = 'below';
        icon = ':cry:';
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

function json(event, testId, jobId, report, additionalInfo, options) {
    let payload = {
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
            message = `:hammer_and_wrench: *Test ${testName} with id: ${testId} is in progress!*`;
            break;
        }
        case WEBHOOK_EVENT_TYPE_API_FAILURE: {
            message = `:boom: *Test ${testName} with id: ${testId} has encountered an API failure!* :skull:`;
            break;
        }
        default: {
            throw unknownWebhookEventTypeError();
        }
    }
    return slackWebhookFormat(message, options);
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
        default: {
            throw new Error(`Unrecognized webhook format: ${format}, available options: ${[EVENT_FORMAT_TYPE_JSON, EVENT_FORMAT_TYPE_SLACK].join()}`);
        }
    }
};
