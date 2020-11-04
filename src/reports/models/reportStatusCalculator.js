const _ = require('lodash');

const constants = require('../utils/constants');

const FINAL_REPORT_STATUSES = [constants.REPORT_FINISHED_STATUS, constants.REPORT_ABORTED_STATUS, constants.REPORT_FAILED_STATUS];
const THREE_MINUTE_IN_MS = 3* 60 * 1000;
const SUBSCRIBER_STAGE_TO_REPORT_STATUS_MAP = {
    [constants.SUBSCRIBER_INITIALIZING_STAGE]: constants.REPORT_INITIALIZING_STATUS,
    [constants.SUBSCRIBER_STARTED_STAGE]: constants.REPORT_STARTED_STATUS,
    [constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE]: constants.REPORT_IN_PROGRESS_STATUS,
    [constants.SUBSCRIBER_INTERMEDIATE_STAGE]: constants.REPORT_IN_PROGRESS_STATUS,
    [constants.SUBSCRIBER_DONE_STAGE]: constants.REPORT_FINISHED_STATUS,
    [constants.SUBSCRIBER_ABORTED_STAGE]: constants.REPORT_ABORTED_STATUS,
    [constants.SUBSCRIBER_FAILED_STAGE]: constants.REPORT_FAILED_STATUS
};

module.exports.calculateReportStatus = function (report, config) {
    const subscribersStages = getListOfSubscribersStages(report);
    const uniqueSubscribersStages = _.uniq(subscribersStages);

    const delayedTimeInMs = Math.max(report.duration * 0.01, config.minimum_wait_for_delayed_report_status_update_in_ms);
    const reportDurationMs = report.duration * 1000;
    const reportStartTimeMs = new Date(report.start_time).getTime();

    const reportStartTimeWithRunnerDelayMs = reportStartTimeMs + delayedTimeInMs;
    const subscribeTimeThresholdForRunnersMs = reportStartTimeWithRunnerDelayMs + THREE_MINUTE_IN_MS;
    const reportTotalTimeMs = reportStartTimeWithRunnerDelayMs + reportDurationMs;
    const now = Date.now();

    const isFinishedStatus = isAllSubscribersFinishedStatus(uniqueSubscribersStages);
    if (isFinishedStatus) {
        return isFinishedStatus;
    }
    if (now <= subscribeTimeThresholdForRunnersMs && !areThereAnySubscribers(uniqueSubscribersStages)) {
        return constants.REPORT_INITIALIZING_STATUS;
    }
    if (now >= subscribeTimeThresholdForRunnersMs && !areThereAnySubscribers(uniqueSubscribersStages)) {
        return constants.REPORT_FAILED_STATUS;
    }
    if (now >= reportTotalTimeMs) {
        return uniqueSubscribersStages.includes(constants.SUBSCRIBER_DONE_STAGE) ? constants.REPORT_PARTIALLY_FINISHED_STATUS : constants.REPORT_FAILED_STATUS;
    }
    if (uniqueSubscribersStages.length === 1) {
        return subscriberStageToReportStatusMap(uniqueSubscribersStages[0]);
    }
    return calculateDynamicReportStatus(uniqueSubscribersStages);
};

function calculateDynamicReportStatus(uniqueSubscribersStages) {
    if (uniqueSubscribersStages.includes(constants.SUBSCRIBER_DONE_STAGE)) {
        return constants.REPORT_PARTIALLY_FINISHED_STATUS;
    }
    if (uniqueSubscribersStages.includes(constants.SUBSCRIBER_INTERMEDIATE_STAGE) ||
        uniqueSubscribersStages.includes(constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE)) {
        return constants.REPORT_IN_PROGRESS_STATUS;
    }
    if (uniqueSubscribersStages.includes(constants.SUBSCRIBER_STARTED_STAGE)) {
        return constants.REPORT_STARTED_STATUS;
    }
    if (uniqueSubscribersStages.includes(constants.SUBSCRIBER_INITIALIZING_STAGE)) {
        return constants.REPORT_INITIALIZING_STATUS;
    }
    return constants.REPORT_FAILED_STATUS;
}

function getListOfSubscribersStages(report) {
    const runnerStates = report.subscribers.map((subscriber) => subscriber.phase_status);
    return runnerStates;
}

function areThereAnySubscribers(subscribersStages) {
    return subscribersStages.length > 0;
}
function isAllSubscribersFinishedStatus(subscribersStages) {
    if (subscribersStages.length === 1) {
        const mappedStatus = subscriberStageToReportStatusMap(subscribersStages);
        if (FINAL_REPORT_STATUSES.includes(mappedStatus)) {
            return mappedStatus;
        }
    }
}

function subscriberStageToReportStatusMap(subscriberStage) {
    return SUBSCRIBER_STAGE_TO_REPORT_STATUS_MAP[subscriberStage];
}
