const should = require('should'),
    URL = require('url').URL,
    fs = require('fs'),
    uuid = require('uuid'),
    Docker = require('dockerode');

const schedulerRequestCreator = require('../integration-tests/jobs/helpers/requestCreator'),
    testsRequestCreator = require('../integration-tests/tests/helpers/requestCreator'),
    configRequestCreator = require('../integration-tests/configManager/helpers/requestCreator'),
    reportsRequestCreator = require('../integration-tests/reports/helpers/requestCreator'),
    statsGenerator = require('../integration-tests/reports/helpers/statsGenerator'),
    dockerConfig = require('../../src/config/dockerConfig'),
    constants = require('../../src/reports/utils/constants'),
    { version: PREDATOR_VERSION } = require('../../package.json'),
    { KafkaHelper } = require('./helpers/kafkaHelper');

const RUNNER_DOCKER_IMAGE = 'zooz/predator-runner:latest';
let kafkaHelper;
let statsTime;
let testBody;
let testId, jobId, reportId;

let dockerConnection;
if (dockerConfig.host) {
    const dockerUrl = new URL(dockerConfig.host);
    dockerConnection = {
        host: dockerUrl.hostname,
        port: dockerUrl.port,
        ca: dockerConfig.certPath ? fs.readFileSync(dockerConfig.certPath + '/ca.pem') : undefined,
        cert: dockerConfig.certPath ? fs.readFileSync(dockerConfig.certPath + '/cert.pem') : undefined,
        key: dockerConfig.certPath ? fs.readFileSync(dockerConfig.certPath + '/key.pem') : undefined
    };
} else {
    dockerConnection = ({ socketPath: '/var/run/docker.sock' });
}
const docker = new Docker(dockerConnection);

describe('Create job specific docker tests', async function () {
    this.timeout(40000);
    const jobPlatform = process.env.JOB_PLATFORM;
    if (jobPlatform.toUpperCase() === 'DOCKER') {
        describe('DOCKER', () => {
            before(async () => {
                await schedulerRequestCreator.init();
                await testsRequestCreator.init();
                await configRequestCreator.init();
                await reportsRequestCreator.init();

                kafkaHelper = new KafkaHelper(process.env.KAFKA_TOPIC, process.env.KAFKA_BROKERS.split(','));
                await kafkaHelper.init();
                await kafkaHelper.startConsuming();

                await configRequestCreator.updateConfig({
                    runner_docker_image: RUNNER_DOCKER_IMAGE
                });

                statsTime = Date.now();
                testBody = require('../testExamples/Basic_test');
                const response = await testsRequestCreator.createTest(testBody, {});
                should(response.statusCode).eql(201);
                testId = response.body.id;
            });
            after(async () => {
                let containers = await docker.listContainers();
                containers = containers.filter(container => {
                    return container.Names && container.Names[0] && container.Names[0].includes('predator.');
                });
                containers.forEach(async container => {
                    const containerToKill = await docker.getContainer(container.Id);
                    await containerToKill.kill();
                });
                await kafkaHelper.disconnect();
            });

            describe('Good requests', () => {
                describe('Run one time job with job-created and job-finished events published', () => {
                    let createJobResponse;
                    const runnerId = uuid.v4();

                    it('Create the job', async () => {
                        const validBody = {
                            test_id: testId,
                            type: 'load_test',
                            arrival_rate: 2,
                            duration: 1,
                            run_immediately: true,
                            notes: 'streaming notes'
                        };

                        createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                            'Content-Type': 'application/json'
                        });

                        jobId = createJobResponse.body.id;
                        reportId = createJobResponse.body.report_id;
                        should(createJobResponse.status).eql(201);
                    });

                    it('Consume published event job-created', async () => {
                        const jobCreatedMessage = await kafkaHelper.getLastMsgs(1);
                        const valuePublished = JSON.parse(jobCreatedMessage[0].value);

                        should(valuePublished.event).eql('job-created');
                        should(valuePublished.resource).containEql({
                            test_id: testId,
                            job_id: jobId,
                            report_id: reportId,
                            job_type: 'load_test',
                            arrival_rate: 2,
                            notes: 'streaming notes',
                            duration: 1
                        });
                    });

                    it('Predator-runner posts "done" stats', async () => {
                        await reportsRequestCreator.subscribeRunnerToReport(testId, reportId, runnerId);
                        const statsFromRunnerIntermediate = statsGenerator.generateStats(constants.SUBSCRIBER_INTERMEDIATE_STAGE, runnerId, statsTime);
                        await reportsRequestCreator.postStats(testId, reportId, statsFromRunnerIntermediate);

                        const statsFromRunnerDone = statsGenerator.generateStats(constants.SUBSCRIBER_DONE_STAGE, runnerId, statsTime);
                        await reportsRequestCreator.postStats(testId, reportId, statsFromRunnerDone);
                    });

                    it('Consume published event job-finished', async () => {
                        const jobFinishedMessage = await kafkaHelper.getLastMsgs(1);
                        const valuePublished = JSON.parse(jobFinishedMessage[0].value);

                        assertFullPublishedValue(valuePublished, constants.REPORT_FINISHED_STATUS, runnerId);
                    });
                });
                describe('Run one time job, abort run, and assert job-finished event published', () => {
                    let createJobResponse;
                    const runnerId = uuid.v4();

                    it('Create the job', async () => {
                        const validBody = {
                            test_id: testId,
                            type: 'load_test',
                            arrival_rate: 2,
                            duration: 1,
                            run_immediately: true,
                            notes: 'streaming notes'
                        };

                        createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                            'Content-Type': 'application/json'
                        });

                        jobId = createJobResponse.body.id;
                        reportId = createJobResponse.body.report_id;
                        should(createJobResponse.status).eql(201);
                    });

                    it('Consume published event job-created', async () => {
                        const jobCreatedMessage = await kafkaHelper.getLastMsgs(1);
                        const valuePublished = JSON.parse(jobCreatedMessage[0].value);

                        should(valuePublished.event).eql('job-created');
                        should(valuePublished.resource).containEql({
                            test_id: testId,
                            job_id: jobId,
                            report_id: reportId,
                            job_type: 'load_test',
                            arrival_rate: 2,
                            notes: 'streaming notes',
                            duration: 1
                        });
                    });

                    it('Predator-runner posts "aborted" stats', async () => {
                        await reportsRequestCreator.subscribeRunnerToReport(testId, reportId, runnerId);
                        const statsFromRunnerIntermediate = statsGenerator.generateStats(constants.SUBSCRIBER_INTERMEDIATE_STAGE, runnerId, statsTime);
                        await reportsRequestCreator.postStats(testId, reportId, statsFromRunnerIntermediate);

                        const statsFromRunnerDone = statsGenerator.generateStats(constants.SUBSCRIBER_ABORTED_STAGE, runnerId, statsTime);
                        await reportsRequestCreator.postStats(testId, reportId, statsFromRunnerDone);
                    });

                    it('Consume published event job-finished', async () => {
                        const jobFinishedMessage = await kafkaHelper.getLastMsgs(1);
                        const valuePublished = JSON.parse(jobFinishedMessage[0].value);

                        assertFullPublishedValue(valuePublished, constants.REPORT_ABORTED_STATUS, runnerId);
                    });
                });
                describe('Run one time job with excluded streaming attributes', () => {
                    let createJobResponse;
                    const runnerId = uuid.v4();

                    it(('Update config with excluded streaming attributes'), async () => {
                        await configRequestCreator.updateConfig({
                            streaming_excluded_attributes: 'intermediates,artillery_test'
                        });
                    });

                    it('Create the job', async () => {
                        const validBody = {
                            test_id: testId,
                            type: 'load_test',
                            arrival_rate: 2,
                            duration: 1,
                            run_immediately: true,
                            notes: 'streaming notes'
                        };

                        createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                            'Content-Type': 'application/json'
                        });

                        jobId = createJobResponse.body.id;
                        reportId = createJobResponse.body.report_id;
                        should(createJobResponse.status).eql(201);
                    });

                    it('Consume published event job-created', async () => {
                        const jobCreatedMessage = await kafkaHelper.getLastMsgs(1);
                        const valuePublished = JSON.parse(jobCreatedMessage[0].value);

                        should(valuePublished.event).eql('job-created');
                        should(valuePublished.resource).containEql({
                            test_id: testId,
                            job_id: jobId,
                            report_id: reportId,
                            job_type: 'load_test',
                            arrival_rate: 2,
                            notes: 'streaming notes',
                            duration: 1
                        });
                    });

                    it('Predator-runner posts "done" stats', async () => {
                        await reportsRequestCreator.subscribeRunnerToReport(testId, reportId, runnerId);
                        const statsFromRunnerIntermediate = statsGenerator.generateStats(constants.SUBSCRIBER_INTERMEDIATE_STAGE, runnerId, statsTime);
                        await reportsRequestCreator.postStats(testId, reportId, statsFromRunnerIntermediate);

                        const statsFromRunnerDone = statsGenerator.generateStats(constants.SUBSCRIBER_DONE_STAGE, runnerId, statsTime);
                        await reportsRequestCreator.postStats(testId, reportId, statsFromRunnerDone);
                    });

                    it('Consume published event job-finished', async () => {
                        const jobFinishedMessage = await kafkaHelper.getLastMsgs(1);
                        const valuePublished = JSON.parse(jobFinishedMessage[0].value);

                        should(valuePublished.event).eql('job-finished');
                        should(valuePublished.resource.intermediates).be.undefined();
                        should(valuePublished.resource.artillery_test).be.undefined();
                        should(valuePublished.resource.aggregate).be.not.undefined();
                    });

                    it(('Remove excluded streaming attributes from config'), async () => {
                        await configRequestCreator.deleteConfig('streaming_excluded_attributes');
                    });
                });
            });
        });
    }
});

function assertFullPublishedValue(valuePublished, reportStatus, runnerId) {
    should(valuePublished.event).eql('job-finished');
    should(valuePublished.metadata).containEql({
        'predator-version': PREDATOR_VERSION,
        'runner-docker-image': RUNNER_DOCKER_IMAGE
    });

    should(valuePublished.resource.test_id).eql(testId);
    should(valuePublished.resource.report_id).eql(reportId);
    should(valuePublished.resource.job_id).eql(jobId);

    should(valuePublished.resource.artillery_test).eql(testBody.artillery_test);
    should(valuePublished.resource.test_name).eql(testBody.name);
    should(valuePublished.resource.description).eql(testBody.description);

    should(valuePublished.resource.status.toLowerCase()).eql(reportStatus.toLowerCase());
    const intermediatesData = JSON.parse(statsGenerator.generateStats(constants.SUBSCRIBER_INTERMEDIATE_STAGE, runnerId, statsTime).data);
    const expectedIntermediates = [
        intermediatesData
    ];
    delete valuePublished.resource.intermediates[0].bucket; // bucket is generated dynamically in stats manager
    should(valuePublished.resource.intermediates).eql(expectedIntermediates);
    should(valuePublished.resource.aggregate).be.not.undefined();

    should(valuePublished.resource.parallelism).eql(1);
    should(valuePublished.resource.arrival_rate).eql(2);
    should(valuePublished.resource.job_type).eql('load_test');
    should(valuePublished.resource.notes).eql('streaming notes');
    should(valuePublished.resource.start_time).be.not.undefined();
    should(valuePublished.resource.end_time).be.not.undefined();
}