const sinon = require('sinon');
const { expect } = require('chai');
const uuid = require('uuid');
const rewire = require('rewire');

const {
    EVENT_FORMAT_TYPES,
    EVENT_FORMAT_TYPE_JSON,
    EVENT_FORMAT_TYPE_SLACK,
    EVENT_FORMAT_TYPE_TEAMS,
    EVENT_FORMAT_TYPE_DISCORD,
    WEBHOOK_GRAVATAR_URL,
    WEBHOOK_TEST_MESSAGE,
    WEBHOOK_TEAMS_DEFAULT_THEME_COLOR,
    WEBHOOK_EVENT_TYPE_STARTED,
    WEBHOOK_EVENT_TYPE_FINISHED,
    WEBHOOK_EVENT_TYPE_ABORTED,
    WEBHOOK_EVENT_TYPE_API_FAILURE,
    WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED,
    WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED,
    WEBHOOK_EVENT_TYPE_IN_PROGRESS,
    WEBHOOK_EVENT_TYPE_FAILED,
    WEBHOOK_EVENT_TYPES,
    WEBHOOK_SLACK_DEFAULT_MESSAGE_ICON,
    WEBHOOK_DEFAULT_REPORTER_NAME
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

    describe('#format', function() {
        describe(EVENT_FORMAT_TYPE_SLACK, function () {
            it(WEBHOOK_EVENT_TYPE_STARTED + ' - load test', function () {
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
                const expectedResult = `🤓 *Test ${report.test_name} with id: ${testId} has started*.\n*test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second, ramp to: ${report.ramp_to} scenarios per second, number of runners: ${report.parallelism}`;

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_SLACK, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report);

                expect(payload.text).to.be.equal(expectedResult);
            });
            it(WEBHOOK_EVENT_TYPE_STARTED + ' - functional test', function () {
                const testId = uuid.v4();
                const jobId = uuid.v4();
                const report = {
                    test_name: 'some test name',
                    arrival_count: 5,
                    duration: 120,
                    environment: 'test',
                    parallelism: 10
                };
                const expectedResult = `🤓 *Test ${report.test_name} with id: ${testId} has started*.\n*test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival count: ${report.arrival_count} scenarios, number of runners: ${report.parallelism}`;

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

                const expectedResult = `😎 *Test ${report.test_name} with id: ${testId} is finished.*\n${stats}\n`;

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
                const expectedResult = `😞 *Test with id: ${testId} Failed*.\ntest configuration:\nenvironment: ${report.environment}\n${additionalInfo.stats.data}`;
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
                    grafana_report: 'http://local.grafana.io/predator'
                };
                const expectedResult = `🤓 *Test ${report.test_name} with id: ${testId} has started*.\n*test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second, ramp to: ${report.ramp_to} scenarios per second, number of runners: ${report.parallelism}`;
                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_SLACK, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report);

                expect(payload.text).to.be.equal(expectedResult);
            });
        });
        describe(EVENT_FORMAT_TYPE_TEAMS, function () {
            it(WEBHOOK_EVENT_TYPE_STARTED + ' - load test', function () {
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
                const expectedResult = {
                    text: `🤓 *Test ${report.test_name} with id: ${testId} has started*.   \n*test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second, ramp to: ${report.ramp_to} scenarios per second, number of runners: ${report.parallelism}`,
                    themeColor: '957c58'
                };
                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report);

                expect(payload).to.eql(expectedResult);
            });
            it(WEBHOOK_EVENT_TYPE_STARTED + ' - functional test', function () {
                const testId = uuid.v4();
                const jobId = uuid.v4();
                const report = {
                    test_name: 'some test name',
                    arrival_count: 5,
                    duration: 120,
                    environment: 'test',
                    parallelism: 10
                };
                const expectedResult = {
                    text: `🤓 *Test ${report.test_name} with id: ${testId} has started*.   \n*test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival count: ${report.arrival_count} scenarios, number of runners: ${report.parallelism}`,
                    themeColor: '957c58'
                };

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report);

                expect(payload).to.eql(expectedResult);
            });
            it(WEBHOOK_EVENT_TYPE_ABORTED, function () {
                const testId = uuid.v4();
                const report = {
                    test_name: 'some name'
                };
                const expectedResult = {
                    text: `😢 *Test ${report.test_name} with id: ${testId} was aborted.*   \n`,
                    themeColor: '957c58'
                };

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_ABORTED, uuid.v4(), testId, report);

                expect(payload).to.eql(expectedResult);
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

                const expectedResult = {
                    text: `😎 *Test ${report.test_name} with id: ${testId} is finished.*   \nsome stats string   \n`,
                    themeColor: '957c58'
                };

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_FINISHED, uuid.v4(), testId, report, additionalInfo);

                expect(payload).to.eql(expectedResult);
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
                const expectedResult = {
                    text: `&#x1F622; *Test ${report.test_name} got a score of ${additionalInfo.score.toFixed(1)}` +
                        ` this is below the threshold of ${additionalInfo.benchmarkThreshold}. last 3 scores are: ${additionalInfo.lastScores.join()}` +
                        `.*   \n${statsText}   \n`,
                    themeColor: '957c58'
                };

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED, uuid.v4(), testId, report, additionalInfo);

                expect(payload).to.be.eql(expectedResult);
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
                const expectedResult = {
                    text: `&#x1F680; *Test some name got a score of ${additionalInfo.score.toFixed(1)}` +
                        ` this is above the threshold of ${additionalInfo.benchmarkThreshold}. last 3 scores are: ${additionalInfo.lastScores.join()}` +
                        `.*   \n${statsText}   \n`,
                    themeColor: '957c58'
                };

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED, uuid.v4(), testId, report, additionalInfo);

                expect(payload).to.eql(expectedResult);
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
                const expectedResult = {
                    text: `😞 *Test with id: ${testId} Failed*.   \ntest configuration:   \nenvironment: test   \n${additionalInfo.stats.data}`,
                    themeColor: '957c58'
                };

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_FAILED, uuid.v4(), testId, report, additionalInfo);

                expect(payload).to.eql(expectedResult);
            });
            it(WEBHOOK_EVENT_TYPE_IN_PROGRESS, function () {
                const testId = uuid.v4();
                const report = {
                    test_name: 'some name'
                };
                const expectedResult = {
                    text: `&#x1F528; *Test some name with id: ${testId} is in progress!*`,
                    themeColor: '957c58'
                };

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_IN_PROGRESS, uuid.v4(), testId, report);

                expect(payload).to.eql(expectedResult);
            });
            it(WEBHOOK_EVENT_TYPE_API_FAILURE, function () {
                const testId = uuid.v4();
                const report = {
                    test_name: 'some name'
                };
                const expectedResult = {
                    text: `&#x1F525; *Test ${report.test_name} with id: ${testId} has encountered an API failure!* &#x1F480;`,
                    themeColor: '957c58'
                };

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_API_FAILURE, uuid.v4(), testId, report);

                expect(payload).to.eql(expectedResult);
            });
            it('uknown event type -> expect error to be thrown', function () {
                const unknownEventType = 'superUknownEventType';
                const expectedErrorMessage = `Unrecognized webhook event: ${unknownEventType}, must be one of the following: ${WEBHOOK_EVENT_TYPES.join(', ')}`;
                expect(webhooksFormatter.format.bind(null, EVENT_FORMAT_TYPE_TEAMS, unknownEventType)).to.throw(expectedErrorMessage);
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
                    grafana_report: 'http://local.grafana.io/predator'
                };
                const expectedResult = {
                    text: `🤓 *Test ${report.test_name} with id: ${testId} has started*.   \n*test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second, ramp to: ${report.ramp_to} scenarios per second, number of runners: ${report.parallelism}`,
                    themeColor: '957c58'
                };

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_TEAMS, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report);

                expect(payload).to.eql(expectedResult);
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
            it('uknown event type -> expect error to be thrown', function () {
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
        describe(EVENT_FORMAT_TYPE_DISCORD, function () {
            it(WEBHOOK_EVENT_TYPE_STARTED + ' - load test', function () {
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
                const expectedResult = `🤓 *Test ${report.test_name} with id: ${testId} has started*.\n*test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second, ramp to: ${report.ramp_to} scenarios per second, number of runners: ${report.parallelism}`;

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_DISCORD, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report);

                expect(payload.content).to.be.equal(expectedResult);
            });
            it(WEBHOOK_EVENT_TYPE_STARTED + ' - functional test', function () {
                const testId = uuid.v4();
                const jobId = uuid.v4();
                const report = {
                    test_name: 'some test name',
                    arrival_count: 5,
                    duration: 120,
                    environment: 'test',
                    parallelism: 10
                };
                const expectedResult = `🤓 *Test ${report.test_name} with id: ${testId} has started*.\n*test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival count: ${report.arrival_count} scenarios, number of runners: ${report.parallelism}`;

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_DISCORD, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report);

                expect(payload.content).to.be.equal(expectedResult);
            });
            it(WEBHOOK_EVENT_TYPE_ABORTED, function () {
                const testId = uuid.v4();
                const report = {
                    test_name: 'some name'
                };
                const expectedResult = `😢 *Test ${report.test_name} with id: ${testId} was aborted.*\n`;

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_DISCORD, WEBHOOK_EVENT_TYPE_ABORTED, uuid.v4(), testId, report);

                expect(payload.content).to.be.equal(expectedResult);
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

                const expectedResult = `😎 *Test ${report.test_name} with id: ${testId} is finished.*\n${stats}\n`;

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_DISCORD, WEBHOOK_EVENT_TYPE_FINISHED, uuid.v4(), testId, report, additionalInfo);

                expect(payload.content).to.be.equal(expectedResult);
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

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_DISCORD, WEBHOOK_EVENT_TYPE_BENCHMARK_FAILED, uuid.v4(), testId, report, additionalInfo);

                expect(payload.content).to.be.equal(expectedResult);
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

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_DISCORD, WEBHOOK_EVENT_TYPE_BENCHMARK_PASSED, uuid.v4(), testId, report, additionalInfo);

                expect(payload.content).to.be.equal(expectedResult);
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
                const expectedResult = `😞 *Test with id: ${testId} Failed*.\ntest configuration:\nenvironment: ${report.environment}\n${additionalInfo.stats.data}`;

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_DISCORD, WEBHOOK_EVENT_TYPE_FAILED, uuid.v4(), testId, report, additionalInfo);

                expect(payload.content).to.be.equal(expectedResult);
            });
            it(WEBHOOK_EVENT_TYPE_IN_PROGRESS, function () {
                const testId = uuid.v4();
                const report = {
                    test_name: 'some name'
                };
                const expectedResult = `:hammer_and_wrench: *Test ${report.test_name} with id: ${testId} is in progress!*`;

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_DISCORD, WEBHOOK_EVENT_TYPE_IN_PROGRESS, uuid.v4(), testId, report);

                expect(payload.content).to.be.equal(expectedResult);
            });
            it(WEBHOOK_EVENT_TYPE_API_FAILURE, function () {
                const testId = uuid.v4();
                const report = {
                    test_name: 'some name'
                };
                const expectedResult = `:boom: *Test ${report.test_name} with id: ${testId} has encountered an API failure!* :skull:`;

                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_DISCORD, WEBHOOK_EVENT_TYPE_API_FAILURE, uuid.v4(), testId, report);

                expect(payload.content).to.be.equal(expectedResult);
            });
            it('uknown event type -> expect error to be thrown', function () {
                const unknownEventType = 'superUknownEventType';
                const expectedErrorMessage = `Unrecognized webhook event: ${unknownEventType}, must be one of the following: ${WEBHOOK_EVENT_TYPES.join(', ')}`;
                expect(webhooksFormatter.format.bind(null, EVENT_FORMAT_TYPE_DISCORD, unknownEventType)).to.throw(expectedErrorMessage);
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
                    grafana_report: 'http://local.grafana.io/predator'
                };
                const expectedResult = `🤓 *Test ${report.test_name} with id: ${testId} has started*.\n*test configuration:* environment: ${report.environment} duration: ${report.duration} seconds, arrival rate: ${report.arrival_rate} scenarios per second, ramp to: ${report.ramp_to} scenarios per second, number of runners: ${report.parallelism}`;
                const payload = webhooksFormatter.format(EVENT_FORMAT_TYPE_DISCORD, WEBHOOK_EVENT_TYPE_STARTED, jobId, testId, report);

                expect(payload.content).to.be.equal(expectedResult);
            });
        });
        describe('Unknown format', function () {
            it('should throw an error', function () {
                const unknownFormat = 'some_random_format';
                expect(webhooksFormatter.format.bind(null, unknownFormat, WEBHOOK_EVENT_TYPE_STARTED)).to.throw(`Unrecognized webhook format: ${unknownFormat}, available options: ${EVENT_FORMAT_TYPES.join()}`);
            });
        });
    });
    describe('#formatSimpleMessage', function () {
        it(EVENT_FORMAT_TYPE_JSON, function () {
            const payload = webhooksFormatter.formatSimpleMessage(EVENT_FORMAT_TYPE_JSON);
            expect(payload).to.have.a.property('greeting').and.to.be.equal(WEBHOOK_TEST_MESSAGE);
        });
        it(EVENT_FORMAT_TYPE_SLACK, function () {
            const payload = webhooksFormatter.formatSimpleMessage(EVENT_FORMAT_TYPE_SLACK);
            expect(payload).to.be.deep.equal({
                text: WEBHOOK_TEST_MESSAGE,
                icon_emoji: WEBHOOK_SLACK_DEFAULT_MESSAGE_ICON,
                username: WEBHOOK_DEFAULT_REPORTER_NAME
            });
        });
        it(EVENT_FORMAT_TYPE_DISCORD, function () {
            const payload = webhooksFormatter.formatSimpleMessage(EVENT_FORMAT_TYPE_DISCORD);
            expect(payload).to.be.deep.equal({
                content: WEBHOOK_TEST_MESSAGE,
                username: WEBHOOK_DEFAULT_REPORTER_NAME,
                avatar_url: WEBHOOK_GRAVATAR_URL + '?s=128'
            });
        });
        it(EVENT_FORMAT_TYPE_TEAMS, function () {
            const payload = webhooksFormatter.formatSimpleMessage(EVENT_FORMAT_TYPE_TEAMS);
            expect(payload).to.have.a.property('text').and.to.be.equal(WEBHOOK_TEST_MESSAGE);
            expect(payload).to.have.a.property('themeColor').and.to.be.equal(WEBHOOK_TEAMS_DEFAULT_THEME_COLOR);
        });
        it('should throw an error for unrecognized format', function () {
            const format = 'totally not a valid format';
            expect(webhooksFormatter.formatSimpleMessage.bind(null, format)).to.throw(`Unrecognized webhook format: ${format}, available options: ${EVENT_FORMAT_TYPES.join()}`);
        });
    });
});
