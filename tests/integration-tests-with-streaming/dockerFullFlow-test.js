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
    { KafkaHelper } = require('./helpers/kafkaHelper');

let kafkaHelper;
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
    let testId;
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
                    runner_docker_image: 'zooz/predator-runner:latest'
                });

                const requestBody = require('../testExamples/Basic_test');
                const response = await testsRequestCreator.createTest(requestBody, {});
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
                            arrival_rate: 1,
                            duration: 1,
                            run_immediately: true
                        };

                        createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(201);
                    });

                    it('Consume published event job-created', async () => {
                        const jobCreatedMessage = await kafkaHelper.getLastMsgs(1);
                        const valuePublished = JSON.parse(jobCreatedMessage[0].value);

                        should(valuePublished.event).eql('job-created');
                    });

                    it('Predator-runner posts "done" stats', async () => {
                        const reportId = createJobResponse.body.report_id;

                        await reportsRequestCreator.subscribeRunnerToReport(testId, reportId, runnerId);
                        const statsFromRunnerIntermediate = statsGenerator.generateStats(constants.SUBSCRIBER_INTERMEDIATE_STAGE, runnerId);
                        await reportsRequestCreator.postStats(testId, createJobResponse.body.report_id, statsFromRunnerIntermediate);

                        const statsFromRunnerDone = statsGenerator.generateStats(constants.SUBSCRIBER_DONE_STAGE, runnerId);
                        await reportsRequestCreator.postStats(testId, createJobResponse.body.report_id, statsFromRunnerDone);
                    });

                    it('Consume published event job-finished', async () => {
                        const jobFinishedMessage = await kafkaHelper.getLastMsgs(1);
                        const valuePublished = JSON.parse(jobFinishedMessage[0].value);

                        should(valuePublished.event).eql('job-finished');
                        should(valuePublished.resource.intermediates).be.not.undefined();
                        should(valuePublished.resource.artillery_test).be.not.undefined();
                        should(valuePublished.resource.aggregate).be.not.undefined();
                    });
                });
                describe('Run one time job, abort run, and assert job-finished event published', () => {
                    let createJobResponse;
                    const runnerId = uuid.v4();

                    it('Create the job', async () => {
                        const validBody = {
                            test_id: testId,
                            type: 'load_test',
                            arrival_rate: 1,
                            duration: 1,
                            run_immediately: true
                        };

                        createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(201);
                    });

                    it('Consume published event job-created', async () => {
                        const jobCreatedMessage = await kafkaHelper.getLastMsgs(1);
                        const valuePublished = JSON.parse(jobCreatedMessage[0].value);

                        should(valuePublished.event).eql('job-created');
                    });

                    it('Predator-runner posts "aborted" stats', async () => {
                        const reportId = createJobResponse.body.report_id;
                        await reportsRequestCreator.subscribeRunnerToReport(testId, reportId, runnerId);
                        const statsFromRunnerIntermediate = statsGenerator.generateStats(constants.SUBSCRIBER_INTERMEDIATE_STAGE, runnerId);
                        await reportsRequestCreator.postStats(testId, createJobResponse.body.report_id, statsFromRunnerIntermediate);

                        const statsFromRunnerDone = statsGenerator.generateStats(constants.SUBSCRIBER_ABORTED_STAGE, runnerId);
                        await reportsRequestCreator.postStats(testId, createJobResponse.body.report_id, statsFromRunnerDone);
                    });

                    it('Consume published event job-finished', async () => {
                        const jobFinishedMessage = await kafkaHelper.getLastMsgs(1);
                        const valuePublished = JSON.parse(jobFinishedMessage[0].value);

                        should(valuePublished.event).eql('job-finished');
                        should(valuePublished.resource.intermediates).be.not.undefined();
                        should(valuePublished.resource.artillery_test).be.not.undefined();
                        should(valuePublished.resource.aggregate).be.not.undefined();
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
                            arrival_rate: 1,
                            duration: 1,
                            run_immediately: true
                        };

                        createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(201);
                    });

                    it('Consume published event job-created', async () => {
                        const jobCreatedMessage = await kafkaHelper.getLastMsgs(1);
                        const valuePublished = JSON.parse(jobCreatedMessage[0].value);

                        should(valuePublished.event).eql('job-created');
                    });

                    it('Predator-runner posts "done" stats', async () => {
                        const reportId = createJobResponse.body.report_id;
                        await reportsRequestCreator.subscribeRunnerToReport(testId, reportId, runnerId);
                        const statsFromRunnerIntermediate = statsGenerator.generateStats(constants.SUBSCRIBER_INTERMEDIATE_STAGE, runnerId);
                        await reportsRequestCreator.postStats(testId, createJobResponse.body.report_id, statsFromRunnerIntermediate);

                        const statsFromRunnerDone = statsGenerator.generateStats(constants.SUBSCRIBER_DONE_STAGE, runnerId);
                        await reportsRequestCreator.postStats(testId, createJobResponse.body.report_id, statsFromRunnerDone);
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
                        await configRequestCreator.updateConfig({
                            streaming_excluded_attributes: ''
                        });
                    });
                });
            });
        });
    }
});