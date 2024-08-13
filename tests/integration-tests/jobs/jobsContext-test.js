const should = require('should'),
    schedulerRequestCreator = require('./helpers/requestCreator'),
    testsRequestCreator = require('../tests/helpers/requestCreator'),
    configRequestCreator = require('../configManager/helpers/requestCreator'),
    Docker = require('dockerode'),
    uuid = require('uuid'),
    dockerConnection = ({ socketPath: '/var/run/docker.sock' });

const docker = new Docker(dockerConnection);

describe('Create job specific docker tests - contexts', async function () {
    this.timeout(20000);
    let testId, testIdContextB;
    let jobIdContextA, jobIdNoContext;
    let jobTemplateBody;
    let contextId;
    const jobPlatform = process.env.JOB_PLATFORM;
    if (jobPlatform.toUpperCase() === 'DOCKER') {
        describe('DOCKER', () => {
            before(async () => {
                contextId = uuid.v4().toString();
                await schedulerRequestCreator.init();
                await testsRequestCreator.init();
                await configRequestCreator.init();

                await configRequestCreator.updateConfig({
                    runner_docker_image: 'zooz/predator-runner:latest'
                });

                const requestBody = require('../../testExamples/Basic_test');
                const responseContextA = await testsRequestCreator.createTest(requestBody, { 'x-context-id': contextId });
                const responseContextB = await testsRequestCreator.createTest(requestBody, { 'x-context-id': 'some-other-context' });

                should(responseContextA.statusCode).eql(201);
                should(responseContextA.body).have.key('id');
                testId = responseContextA.body.id;
                testIdContextB = responseContextB.body.id;

                jobTemplateBody = {
                    test_id: testId,
                    arrival_rate: 1,
                    parallelism: 1,
                    type: 'load_test',
                    duration: 1,
                    environment: 'test',
                    cron_expression: '1 1 1 1 1 1',
                    max_virtual_users: 100
                };
            });
            // after(async () => {
            //     let containers = await docker.listContainers();
            //     containers = containers.filter(container => {
            //         return container.Names && container.Names[0] && container.Names[0].includes('predator.');
            //     });
            //     containers.forEach(async container => {
            //         const containerToKill = await docker.getContainer(container.Id);
            //         await containerToKill.kill();
            //     });
            // });

            describe('Verify context id is used as filter', () => {
                it('Create job with context', async () => {
                    const validBody = jobTemplateBody;

                    const createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                        'Content-Type': 'application/json',
                        'x-context-id': contextId
                    });

                    should(createJobResponse.status).eql(201);
                    jobIdContextA = createJobResponse.body.id;
                });

                it('Create job without context', async () => {
                    const validBody = jobTemplateBody;

                    const createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                        'Content-Type': 'application/json'
                    });

                    should(createJobResponse.status).eql(201);
                    jobIdNoContext = createJobResponse.body.id;
                });

                it('Create job with test id that belongs to other context', async () => {
                    const validBody = jobTemplateBody;
                    validBody.test_id = testIdContextB;

                    const createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                        'Content-Type': 'application/json',
                        'x-context-id': contextId
                    });

                    should(createJobResponse.status).eql(400);
                });

                it('Get jobs without context should return both jobs', async () => {
                    const getJobsResponse = await schedulerRequestCreator.getJobs({
                        'Content-Type': 'application/json'
                    });

                    should(getJobsResponse.status).eql(200);
                    const contextAResponse = getJobsResponse.body.find(o => o.id === jobIdContextA);
                    should(contextAResponse).not.eql(undefined);

                    const noContextResponse = getJobsResponse.body.find(o => o.id === jobIdNoContext);
                    should(noContextResponse).not.eql(undefined);
                });

                it('Get jobs with context should return one job', async () => {
                    const getJobsResponse = await schedulerRequestCreator.getJobs({
                        'Content-Type': 'application/json',
                        'x-context-id': contextId
                    });

                    should(getJobsResponse.status).eql(200);
                    should(getJobsResponse.body.length).eql(1);

                    const contextAResponse = getJobsResponse.body.find(o => o.id === jobIdContextA);
                    should(contextAResponse).not.eql(undefined);
                });

                it('Get single job with context should return one job', async () => {
                    const getJobsResponse = await schedulerRequestCreator.getJob(jobIdContextA, {
                        'Content-Type': 'application/json',
                        'x-context-id': contextId
                    });

                    should(getJobsResponse.status).eql(200);
                    should(getJobsResponse.body.id).eql(jobIdContextA);
                });

                it('Get single job with other context should return 404', async () => {
                    const getJobsResponse = await schedulerRequestCreator.getJob(jobIdContextA, {
                        'Content-Type': 'application/json',
                        'x-context-id': 'some-context'
                    });

                    should(getJobsResponse.status).eql(404);
                });

                it('Get single job with no context should return 200', async () => {
                    const getJobsResponse = await schedulerRequestCreator.getJob(jobIdContextA, {
                        'Content-Type': 'application/json'
                    });

                    should(getJobsResponse.status).eql(200);
                    should(getJobsResponse.body.id).eql(jobIdContextA);
                });

                it.skip('Get logs with correct context should return 200', async () => {
                    const getJobsResponse = await schedulerRequestCreator.getLogs(jobIdContextA, 'some-report', {
                        'Content-Type': 'application/json',
                        'x-context-id': contextId
                    });

                    should(getJobsResponse.status).eql(200);
                });

                it('Get logs with no matching context should return 404', async () => {
                    const getJobsResponse = await schedulerRequestCreator.getLogs(jobIdContextA, 'some-report', {
                        'Content-Type': 'application/json',
                        'x-context-id': 'some-context'
                    });

                    should(getJobsResponse.status).eql(404);
                });

                it.skip('stop job with correct context should return 204', async () => {
                    const getJobsResponse = await schedulerRequestCreator.stopRun(jobIdContextA, 'some-report', {
                        'Content-Type': 'application/json',
                        'x-context-id': contextId
                    });

                    should(getJobsResponse.status).eql(204);
                });

                it('stop job with no matching context should return 404', async () => {
                    const getJobsResponse = await schedulerRequestCreator.getLogs(jobIdContextA, 'some-report', {
                        'Content-Type': 'application/json',
                        'x-context-id': 'some-context'
                    });

                    should(getJobsResponse.status).eql(404);
                });
            });
        });
    }
});
