const sinon = require('sinon');
const { expect } = require('chai');
const uuid = require('uuid');
const rewire = require('rewire');

const {
    EVENT_FORMAT_TYPE_JSON,
    EVENT_FORMAT_TYPE_SLACK,
    EVENT_FORMAT_TYPE_TEAMS,
    WEBHOOK_EVENT_TYPE_STARTED,
    WEBHOOK_EVENT_TYPE_FINISHED,
    WEBHOOK_EVENT_TYPE_ABORTED,
    WEBHOOK_EVENT_TYPE_API_FAILURE,
    WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED,
    WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED,
    WEBHOOK_EVENT_TYPE_IN_PROGRESS,
    WEBHOOK_EVENT_TYPE_FAILED,
    WEBHOOK_EVENT_TYPES
} = require('../../../src/common/consts');
const webhooksFormatter = rewire('../../../src/webhooks/models/webhooksFormatter');

describe('webhooksFormatter', function () {
    let sandbox;
    let statsFormatterStub;
    before('Setup', function() {
        sandbox = sinon.sandbox.create();
        statsFormatterStub = sandbox.stub();
        webhooksFormatter.__set__('statsFormatter.getStatsFormatted', statsFormatterStub);
    });
    afterEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });
    describe(EVENT_FORMAT_TYPE_SLACK, function() {
        it(WEBHOOK_EVENT_TYPE_STARTED + ' - load test', function() {
            const testId = uuid.v4();
            const jobId = uuid.v4();
            const report = {
                ramp_to: 100,
                test_name: 'some test name',
                arrival_rate: 5,
                duration: 120,
                environment: 'test',
                parallelism: 10
            };
            const expectedResult = `🤓 *Test ${report.test_name} with id: ${testId} has started*.\n
            *test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second, ramp to: ${report.ramp_to} scenarios per second, number of runners: ${report.parallelism}`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_SLACK, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_STARTED + ' - functional test', function() {
            const testId = uuid.v4();
            const jobId = uuid.v4();
            const report = {
                test_name: 'some test name',
                arrival_count: 5,
                duration: 120,
                environment: 'test',
                parallelism: 10
            };
            const expectedResult = `🤓 *Test ${report.test_name} with id: ${testId} has started*.\n
            *test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival count: ${report.arrival_count} scenarios, number of runners: ${report.parallelism}`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_SLACK, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_ABORTED, function () {
            const testId = uuid.v4();
            const report = {
                test_name: 'some name'
            };
            const expectedResult = `😢 *Test ${report.test_name} with id: ${testId} was aborted.*\n`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_SLACK, WEBHOOK_EVENT_TYPE_ABORTED, uuid.v4(), testId, report);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_FINISHED, function () {
            const testId = uuid.v4();
            const report = {
                test_name: 'some name'
            };
            const additionalInfo = {
                aggregatedReport: {
                    aggregate: {
                        key: 'value'
                    }
                }
            };
            const stats = 'some stats string';
            statsFormatterStub.returns(stats);

            const expectedResult = `😎 *Test ${report.test_name} with id: ${testId} is finished.*\n ${stats}\n`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_SLACK, WEBHOOK_EVENT_TYPE_FINISHED, uuid.v4(), testId, report, additionalInfo);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED, function () {
            const testId = uuid.v4();
            const report = {
                test_name: 'some name'
            };
            const additionalInfo = {
                lastScores: [25, 60, 12],
                score: 45,
                benchmarkThreshold: 90,
                aggregatedReport: {
                    aggregate: {
                        key: 'value'
                    }
                }
            };
            const statsText = 'some text';
            statsFormatterStub.returns(statsText);
            const expectedResult = `:cry: *Test ${report.test_name} got a score of ${additionalInfo.score.toFixed(1)}` +
                ` this is below the threshold of ${additionalInfo.benchmarkThreshold}. last 3 scores are: ${additionalInfo.lastScores.join()}` +
                `.*\n${statsText}\n`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_SLACK, WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED, uuid.v4(), testId, report, additionalInfo);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED, function () {
            const testId = uuid.v4();
            const report = {
                test_name: 'some name'
            };
            const additionalInfo = {
                lastScores: [90, 100, 100],
                score: 97.5,
                benchmarkThreshold: 90,
                aggregatedReport: {
                    aggregate: {
                        key: 'value'
                    }
                }
            };
            const statsText = 'some text';
            statsFormatterStub.returns(statsText);
            const expectedResult = `:rocket: *Test ${report.test_name} got a score of ${additionalInfo.score.toFixed(1)}` +
                ` this is above the threshold of ${additionalInfo.benchmarkThreshold}. last 3 scores are: ${additionalInfo.lastScores.join()}` +
                `.*\n${statsText}\n`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_SLACK, WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED, uuid.v4(), testId, report, additionalInfo);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_FAILED, function () {
            const testId = uuid.v4();
            const report = {
                test_name: 'some name',
                environment: 'test'
            };
            const additionalInfo = {
                stats: {
                    data: 'data'
                }
            };
            const expectedResult = `😞 *Test with id: ${testId} Failed*.\n
            test configuration:\n
            environment: ${report.environment}\n
            ${additionalInfo.stats.data}`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_SLACK, WEBHOOK_EVENT_TYPE_FAILED, uuid.v4(), testId, report, additionalInfo);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_IN_PROGRESS, function () {
            const testId = uuid.v4();
            const report = {
                test_name: 'some name'
            };
            const expectedResult = `:hammer_and_wrench: *Test ${report.test_name} with id: ${testId} is in progress!*`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_SLACK, WEBHOOK_EVENT_TYPE_IN_PROGRESS, uuid.v4(), testId, report);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_API_FAILURE, function () {
            const testId = uuid.v4();
            const report = {
                test_name: 'some name'
            };
            const expectedResult = `:boom: *Test ${report.test_name} with id: ${testId} has encountered an API failure!* :skull:`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_SLACK, WEBHOOK_EVENT_TYPE_API_FAILURE, uuid.v4(), testId, report);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it('uknown event type -> expect error to be thrown', function () {
            const unknownEventType = 'superUknownEventType';
            const expectedErrorMessage = `Unrecognized webhook event: ${unknownEventType}, must be one of the following: ${WEBHOOK_EVENT_TYPES.join(', ')}`;
            expect(webhooksFormatter.format.bind(null, EVENT_FORMAT_TYPE_SLACK, unknownEventType)).to.throw(expectedErrorMessage);
        });
        it('should display the grafana url if specified in report', function() {
            const testId = uuid.v4();
            const jobId = uuid.v4();
            const report = {
                ramp_to: 100,
                test_name: 'some test name',
                arrival_rate: 5,
                duration: 120,
                environment: 'test',
                parallelism: 10,
                grafana_report: 'http://local.grafana.io/predator'
            };
            const expectedResult = `🤓 *Test ${report.test_name} with id: ${testId} has started*.\n
            *test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second, ramp to: ${report.ramp_to} scenarios per second, number of runners: ${report.parallelism}`;
            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_SLACK, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report);

            expect(payload.text).to.be.equal(expectedResult);
        });
    });
    describe(EVENT_FORMAT_TYPE_TEAMS, function() {
        it(WEBHOOK_EVENT_TYPE_STARTED + ' - load test', function() {
            const testId = uuid.v4();
            const jobId = uuid.v4();
            const report = {
                ramp_to: 100,
                test_name: 'some test name',
                arrival_rate: 5,
                duration: 120,
                environment: 'test',
                parallelism: 10
            };
            const expectedResult = `🤓 *Test ${report.test_name} with id: ${testId} has started*.\n
            *test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second, ramp to: ${report.ramp_to} scenarios per second, number of runners: ${report.parallelism}`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_STARTED + ' - functional test', function() {
            const testId = uuid.v4();
            const jobId = uuid.v4();
            const report = {
                test_name: 'some test name',
                arrival_count: 5,
                duration: 120,
                environment: 'test',
                parallelism: 10
            };
            const expectedResult = `🤓 *Test ${report.test_name} with id: ${testId} has started*.\n
            *test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival count: ${report.arrival_count} scenarios, number of runners: ${report.parallelism}`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_ABORTED, function () {
            const testId = uuid.v4();
            const report = {
                test_name: 'some name'
            };
            const expectedResult = `😢 *Test ${report.test_name} with id: ${testId} was aborted.*\n`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_ABORTED, uuid.v4(), testId, report);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_FINISHED, function () {
            const testId = uuid.v4();
            const report = {
                test_name: 'some name'
            };
            const additionalInfo = {
                aggregatedReport: {
                    aggregate: {
                        key: 'value'
                    }
                }
            };
            const stats = 'some stats string';
            statsFormatterStub.returns(stats);

            const expectedResult = `😎 *Test ${report.test_name} with id: ${testId} is finished.*\n ${stats}\n`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_FINISHED, uuid.v4(), testId, report, additionalInfo);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED, function () {
            const testId = uuid.v4();
            const report = {
                test_name: 'some name'
            };
            const additionalInfo = {
                lastScores: [25, 60, 12],
                score: 45,
                benchmarkThreshold: 90,
                aggregatedReport: {
                    aggregate: {
                        key: 'value'
                    }
                }
            };
            const statsText = 'some text';
            statsFormatterStub.returns(statsText);
            const expectedResult = `:cry: *Test ${report.test_name} got a score of ${additionalInfo.score.toFixed(1)}` +
                ` this is below the threshold of ${additionalInfo.benchmarkThreshold}. last 3 scores are: ${additionalInfo.lastScores.join()}` +
                `.*\n${statsText}\n`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED, uuid.v4(), testId, report, additionalInfo);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED, function () {
            const testId = uuid.v4();
            const report = {
                test_name: 'some name'
            };
            const additionalInfo = {
                lastScores: [90, 100, 100],
                score: 97.5,
                benchmarkThreshold: 90,
                aggregatedReport: {
                    aggregate: {
                        key: 'value'
                    }
                }
            };
            const statsText = 'some text';
            statsFormatterStub.returns(statsText);
            const expectedResult = `:rocket: *Test ${report.test_name} got a score of ${additionalInfo.score.toFixed(1)}` +
                ` this is above the threshold of ${additionalInfo.benchmarkThreshold}. last 3 scores are: ${additionalInfo.lastScores.join()}` +
                `.*\n${statsText}\n`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED, uuid.v4(), testId, report, additionalInfo);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_FAILED, function () {
            const testId = uuid.v4();
            const report = {
                test_name: 'some name',
                environment: 'test'
            };
            const additionalInfo = {
                stats: {
                    data: 'data'
                }
            };
            const expectedResult = `😞 *Test with id: ${testId} Failed*.\n
            test configuration:\n
            environment: ${report.environment}\n
            ${additionalInfo.stats.data}`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_FAILED, uuid.v4(), testId, report, additionalInfo);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_IN_PROGRESS, function () {
            const testId = uuid.v4();
            const report = {
                test_name: 'some name'
            };
            const expectedResult = `:hammer_and_wrench: *Test ${report.test_name} with id: ${testId} is in progress!*`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_IN_PROGRESS, uuid.v4(), testId, report);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it(WEBHOOK_EVENT_TYPE_API_FAILURE, function () {
            const testId = uuid.v4();
            const report = {
                test_name: 'some name'
            };
            const expectedResult = `:boom: *Test ${report.test_name} with id: ${testId} has encountered an API failure!* :skull:`;

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_API_FAILURE, uuid.v4(), testId, report);

            expect(payload.text).to.be.equal(expectedResult);
        });
        it('uknown event type -> expect error to be thrown', function () {
            const unknownEventType = 'superUknownEventType';
            const expectedErrorMessage = `Unrecognized webhook event: ${unknownEventType}, must be one of the following: ${WEBHOOK_EVENT_TYPES.join(', ')}`;
            expect(webhooksFormatter.format.bind(null, EVENT_FORMAT_TYPE_TEAMS, unknownEventType)).to.throw(expectedErrorMessage);
        });
        it('should display the grafana url if specified in report', function() {
            const testId = uuid.v4();
            const jobId = uuid.v4();
            const report = {
                ramp_to: 100,
                test_name: 'some test name',
                arrival_rate: 5,
                duration: 120,
                environment: 'test',
                parallelism: 10,
                grafana_report: 'http://local.grafana.io/predator'
            };
            const expectedResult = `🤓 *Test ${report.test_name} with id: ${testId} has started*.\n
            *test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second, ramp to: ${report.ramp_to} scenarios per second, number of runners: ${report.parallelism}`;
            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report);

            expect(payload.text).to.be.equal(expectedResult);
        });
    });
    describe(EVENT_FORMAT_TYPE_JSON, function () {
        WEBHOOK_EVENT_TYPES.forEach(webhookEventType => {
            it(webhookEventType, function () {
                const testId = uuid.v4();
                const jobId = uuid.v4();
                const report = {
                    ramp_to: 100,
                    test_name: 'some test name',
                    arrival_rate: 5,
                    duration: 120,
                    environment: 'test',
                    parallelism: 10
                };
                const additionalInfo = {
                    some: {
                        nested: {
                            value: ['Look', 'more', 'values']
                        }
                    }
                };
                const expectedResult = {
                    test_id: testId,
                    job_id: jobId,
                    event: webhookEventType,
                    additional_details: {
                        report,
                        ...additionalInfo
                    }
                };

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_JSON, webhookEventType, jobId, testId, report, additionalInfo);

                expect(payload).to.be.deep.equal(expectedResult);
            });
        });
        it('uknown event type -> expect error to be thrown', function() {
            const unknownEventType = 'superUknownEventType';
            const expectedErrorMessage = `Unrecognized webhook event: ${unknownEventType}, must be one of the following: ${WEBHOOK_EVENT_TYPES.join(', ')}`;
            expect(webhooksFormatter.format.bind(null, EVENT_FORMAT_TYPE_JSON, unknownEventType)).to.throw(expectedErrorMessage);
        });
        it('should display the grafana url if specified in report', function () {
            const testId = uuid.v4();
            const jobId = uuid.v4();
            const report = {
                ramp_to: 100,
                test_name: 'some test name',
                arrival_rate: 5,
                duration: 120,
                environment: 'test',
                parallelism: 10,
                grafana_report: 'https://local.predator.io/grafana'
            };
            const additionalInfo = {
                some: {
                    nested: {
                        value: ['Look', 'more', 'values']
                    }
                }
            };
            const expectedResult = {
                test_id: testId,
                job_id: jobId,
                event: WEBHOOK_EVENT_TYPE_STARTED,
                additional_details: {
                    report,
                    ...additionalInfo
                }
            };

            const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_JSON, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report, additionalInfo);

            expect(payload).to.be.deep.equal(expectedResult);
        });
    });
    describe('Unknown format', function() {
        it('should throw an error', function() {
            const unknownFormat = 'some_random_format';
            expect(webhooksFormatter.format.bind(null, unknownFormat, WEBHOOK_EVENT_TYPE_STARTED)).to.throw(`Unrecognized webhook format: ${unknownFormat}, available options: ${[EVENT_FORMAT_TYPE_JSON, EVENT_FORMAT_TYPE_SLACK].join()}`);
        });
    });
});
