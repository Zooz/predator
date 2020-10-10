const { expect } = require('chai');

const constants = require('../../../../src/reports/utils/constants');
const reportStatusCalculator = require('../../../../src/reports/models/reportStatusCalculator');

describe('reportStatusCalculator', function() {
    describe('#calculateReportStatus', function() {
        it('Should return initialized status for request under the time initialization threshold', function() {
            const report = {
                duration: 100,
                subscribers: [],
                start_time: Date.now() + 2 * 60 * 60 * 1000 // in 2 hours
            };
            const config = {
                minimum_wait_for_delayed_report_status_update_in_ms: 100
            };
            const result = reportStatusCalculator.calculateReportStatus(report, config);
            expect(result).to.be.equal(constants.REPORT_INITIALIZING_STATUS);
        });
        it('Should return done status for all subscribers in done state', function () {
            const report = {
                duration: 1,
                subscribers: [{ phase_status: constants.SUBSCRIBER_DONE_STAGE }, { phase_status: constants.SUBSCRIBER_DONE_STAGE }],
                start_time: Date.now() - 60 * 1000 // a minute ago
            };
            const config = {
                minimum_wait_for_delayed_report_status_update_in_ms: 100
            };
            const result = reportStatusCalculator.calculateReportStatus(report, config);
            expect(result).to.be.equal(constants.REPORT_FINISHED_STATUS);
        });
        it('Should return partially finished status for first subscriber in done and second in aborted', function () {
            const report = {
                duration: 1,
                subscribers: [{ phase_status: constants.SUBSCRIBER_DONE_STAGE }, { phase_status: constants.SUBSCRIBER_ABORTED_STAGE }],
                start_time: Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
            };
            const config = {
                minimum_wait_for_delayed_report_status_update_in_ms: 100
            };
            const result = reportStatusCalculator.calculateReportStatus(report, config);
            expect(result).to.be.equal(constants.REPORT_PARTIALLY_FINISHED_STATUS);
        });
        it('Should return failed status for first subscriber in intermediate and second in aborted', function () {
            const report = {
                duration: 1,
                subscribers: [{ phase_status: constants.SUBSCRIBER_INTERMEDIATE_STAGE }, { phase_status: constants.SUBSCRIBER_ABORTED_STAGE }],
                start_time: Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
            };
            const config = {
                minimum_wait_for_delayed_report_status_update_in_ms: 100
            };
            const result = reportStatusCalculator.calculateReportStatus(report, config);
            expect(result).to.be.equal(constants.REPORT_FAILED_STATUS);
        });
        it('Should return in_progress status for both subscribers still running', function () {
            const report = {
                duration: 360,
                subscribers: [{ phase_status: constants.SUBSCRIBER_INTERMEDIATE_STAGE }, { phase_status: constants.SUBSCRIBER_INTERMEDIATE_STAGE }],
                start_time: Date.now() - 3 * 60 * 1000 // 3 minutes ago
            };
            const config = {
                minimum_wait_for_delayed_report_status_update_in_ms: 100
            };
            const result = reportStatusCalculator.calculateReportStatus(report, config);
            expect(result).to.be.equal(constants.REPORT_IN_PROGRESS_STATUS);
        });
        it('Should return partially finished status for 3 subscribers 2 in done and 1 in aborted', function () {
            const report = {
                duration: 360,
                subscribers: [
                    { phase_status: constants.SUBSCRIBER_DONE_STAGE },
                    { phase_status: constants.SUBSCRIBER_DONE_STAGE },
                    { phase_status: constants.SUBSCRIBER_ABORTED_STAGE }
                ],
                start_time: Date.now() - 3 * 60 * 1000 // 3 minutes ago
            };
            const config = {
                minimum_wait_for_delayed_report_status_update_in_ms: 100
            };
            const result = reportStatusCalculator.calculateReportStatus(report, config);
            expect(result).to.be.equal(constants.REPORT_PARTIALLY_FINISHED_STATUS);
        });
        it('Should return in_progress finished status for 3 subscribers 2 in intermediate and 1 in first_intermediate', function () {
            const report = {
                duration: 360,
                subscribers: [
                    { phase_status: constants.SUBSCRIBER_INTERMEDIATE_STAGE },
                    { phase_status: constants.SUBSCRIBER_INTERMEDIATE_STAGE },
                    { phase_status: constants.SUBSCRIBER_FIRST_INTERMEDIATE_STAGE }
                ],
                start_time: Date.now() - 3 * 60 * 1000 // 3 minutes ago
            };
            const config = {
                minimum_wait_for_delayed_report_status_update_in_ms: 100
            };
            const result = reportStatusCalculator.calculateReportStatus(report, config);
            expect(result).to.be.equal(constants.REPORT_IN_PROGRESS_STATUS);
        });
        it('Should return started status for 3 subscribers in started stage', function () {
            const report = {
                duration: 360,
                subscribers: [
                    { phase_status: constants.SUBSCRIBER_STARTED_STAGE },
                    { phase_status: constants.SUBSCRIBER_STARTED_STAGE },
                    { phase_status: constants.SUBSCRIBER_STARTED_STAGE }
                ],
                start_time: Date.now() - 3 * 60 * 1000 // 3 minutes ago
            };
            const config = {
                minimum_wait_for_delayed_report_status_update_in_ms: 100
            };
            const result = reportStatusCalculator.calculateReportStatus(report, config);
            expect(result).to.be.equal(constants.REPORT_STARTED_STATUS);
        });
        it('Should return init status for 3 subscribers in init stage', function () {
            const report = {
                duration: 360,
                subscribers: [
                    { phase_status: constants.SUBSCRIBER_INITIALIZING_STAGE },
                    { phase_status: constants.SUBSCRIBER_INITIALIZING_STAGE },
                    { phase_status: constants.SUBSCRIBER_INITIALIZING_STAGE }
                ],
                start_time: Date.now() - 3 * 60 * 1000 // 3 minutes ago
            };
            const config = {
                minimum_wait_for_delayed_report_status_update_in_ms: 100
            };
            const result = reportStatusCalculator.calculateReportStatus(report, config);
            expect(result).to.be.equal(constants.REPORT_INITIALIZING_STATUS);
        });
        it('Should return failed status for 3 subscribers in aborted stages', function () {
            const report = {
                duration: 360,
                subscribers: [
                    { phase_status: constants.REPORT_ABORTED_STATUS },
                    { phase_status: constants.REPORT_ABORTED_STATUS },
                    { phase_status: constants.REPORT_ABORTED_STATUS }
                ],
                start_time: Date.now() - 3 * 60 * 1000 // 3 minutes ago
            };
            const config = {
                minimum_wait_for_delayed_report_status_update_in_ms: 100
            };
            const result = reportStatusCalculator.calculateReportStatus(report, config);
            expect(result).to.be.equal(constants.REPORT_ABORTED_STATUS);
        });
        it('Should return failed status for 0 subscribers after initialization grace period', function() {
            const report = {
                duration: 100,
                subscribers: [],
                start_time: Date.now() - 2 * 60 * 60 * 1000 // 2 hours ago
            };
            const config = {
                minimum_wait_for_delayed_report_status_update_in_ms: 100
            };
            const result = reportStatusCalculator.calculateReportStatus(report, config);
            expect(result).to.be.equal(constants.REPORT_FAILED_STATUS);
        });
    });
});
