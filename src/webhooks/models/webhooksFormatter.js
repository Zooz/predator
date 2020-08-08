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
const statsFromatter = require('./statsFormatter');

function unknownWebhookEventTypeError(badWebhookEventTypeValue) {
    return new Error(`Unrecognized webhook event: ${badWebhookEventTypeValue}, must be one of the following: ${WEBHOOK_EVENT_TYPES.join(', ')}`);
}

function slackWebhookFormat(message, options) {
    return {
        text: message,
        icon_emoji: options.icon || WEBHOOK_SLACK_DEFAULT_MESSAGE_ICON,
        username: WEBHOOK_SLACK_DEFAULT_REPORTER_NAME
    };
}

function json(event, testId, jobId, report, options) {
    let payload = {
        test_id: testId,
        job_id: jobId,
        event: event,
        additional_details: {}
    };
    let additionalDetails = {};
    switch (event) {
        case WEBHOOK_EVENT_TYPE_STARTED: {
            additionalDetails = {
                test_name: ,
                environment: ,
                duration: ,
                arrival_rate: ,
                parallelism: ,
                ramp_to: rampTo,
            };
            break;
        }
        case WEBHOOK_EVENT_TYPE_FINISHED: {
            additionalDetails = {
                test_name: ,
                grafana_report: ,
                aggregated_report: {
                    ...aggregatedReport.aggregate
                },
                report_benchmark: {
                    ...reportBenchmark
                }
            };
            break;
        }
        case WEBHOOK_EVENT_TYPE_FAILED: {
            additionalDetails = {
                environment: ,
                stats: {
                    ...stats.data
                }
            };
            break;
        }
        case WEBHOOK_EVENT_TYPE_ABORTED: {
            additionalDetails = {
                testName,
                grafanaReport: 
            };
            break;
        }
        case WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED: {
            additionalDetails = {
                aggregated_test_name: ,
                benchmark_threshold: ,
                score: ,
                last_three_scores: ,
                aggregated_report: 
            };
            break;
        }
        case WEBHOOK_EVENT_TYPE_IN_PROGRESS: {
            break;
        }
        case WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED: {
            additionalDetails = {

            };
            break;
        }
        case WEBHOOK_EVENT_TYPE_API_FAILURE: {
            additionalDetails = {

            };
            break;
        }
        default: {
            throw unknownWebhookEventTypeError();
        }
    }
    payload.additional_details = additionalDetails;
    return payload;
}

function slack(event, testId, jobId, report, options) {
    let message = null;
    const {
        environment,
        duration,
        parallelism = 1,
        ramp_to: rampTo,
        arrival_rate: arrivalRate,
        test_name: testName,
        grafana_report: grafanaReport
    } = report;
    const { aggregatedReport, reportBenchmark } = options;
    switch (event) {
        case WEBHOOK_EVENT_TYPE_STARTED: {
            let rampToMessage = rampTo ? `, ramp to: ${rampTo} scenarios per second` : '';
            message = `🤓 *Test ${testName} with id: ${testId} has started*.\n
            *test configuration:* environment: ${environment} duration: ${duration} seconds, arrival rate: ${arrivalRate} scenarios per second, number of runners: ${parallelism}${rampToMessage}`;
            break;
        }
        case WEBHOOK_EVENT_TYPE_FINISHED: {
            message = `😎 *Test ${testName} with id: ${testId} is finished.*\n
            ${statsFromatter.getStatsFormatted('aggregate', aggregatedReport.aggregate, reportBenchmark)}\n`;
            if (grafanaReport) {
                message += `<${grafanaReport}|View final grafana dashboard report>`;
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
            if (grafanaReport) {
                message += `<${grafanaReport}|View final grafana dashboard report>`;
            }
            break;
        }
        case WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED: {
            message = `:sad_1: *Test ${aggregatedtestName} got a score of ${score.toFixed(1)}` +
            ` this is below the threshold of ${benchmarkThreshold}. ${lastScores.length > 0 ? `last 3 scores are: ${lastScores.join()}` : 'no last score to show'}` +
            `.*\n${statsFromatter.getStatsFormatted('aggregate', aggregatedReport.aggregate, { score })}\n`;
            break;
        }
        case WEBHOOK_EVENT_TYPE_IN_PROGRESS: {
            break;
        }
        case WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED: {
            break;
        }
        case WEBHOOK_EVENT_TYPE_API_FAILURE: {
            break;
        }
        default: {
            throw unknownWebhookEventTypeError();
        }
    }
    return slackWebhookFormat(message);
}

module.exports = function(format, eventType, jobId, testId, report, options={}) {
    switch(format) {
        case EVENT_FORMAT_TYPE_SLACK: {
            return slack(eventType, testId, jobId, report, options);
        }
        case EVENT_FORMAT_TYPE_JSON: {
            return json(eventType, testId, jobId, report, options);
        }
        default: {
            throw new Error(`Unrecognized webhook format: ${format}, available options: ${[EVENT_FORMAT_TYPE_JSON, EVENT_FORMAT_TYPE_SLACK].join()}`)
        }
    }
}