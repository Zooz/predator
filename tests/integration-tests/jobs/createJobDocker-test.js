const should = require('should'),
    URL = require('url').URL,
    fs = require('fs'),
    schedulerRequestCreator = require('./helpers/requestCreator'),
    testsRequestCreator = require('../tests/helpers/requestCreator'),
    nock = require('nock'),
    Docker = require('dockerode'),
    dockerConfig = require('../../../src/config/dockerConfig');
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
let docker = new Docker(dockerConnection);

describe('Create job specific docker tests', async function () {
    this.timeout(20000);
    let testId;
    let expectedResult;
    beforeEach(async () => {
        nock.cleanAll();
    });
    const jobPlatform = process.env.JOB_PLATFORM;
    if (jobPlatform === 'DOCKER') {
        describe('DOCKER', () => {
            before(async () => {
                await schedulerRequestCreator.init();
                await testsRequestCreator.init();

                let requestBody = require('../../testExamples/Basic_test');
                let response = await testsRequestCreator.createTest(requestBody, {});
                should(response.statusCode).eql(201);
                should(response.body).have.key('id');
                testId = response.body.id;

                expectedResult = {
                    environment: 'test',
                    test_id: testId,
                    duration: 1,
                    arrival_rate: 1,
                    max_virtual_users: 100,
                    proxy_url: 'http://proxy.com',
                    debug: '*'
                };
            });
            after(async () => {
                let containers = await docker.listContainers();
                containers = containers.filter(container => {
                    return container.Names && container.Names[0] && container.Names[0].includes('predator.');
                });
                containers.forEach(async container => {
                    let containerToKill = await docker.getContainer(container.Id);
                    await containerToKill.kill();
                });
            });

            describe('Good requests', () => {
                let jobId;

                describe('Create one time job with parallelism 2, job not yet exists, should create job with the right parameters and run it, finally stop and delete it', () => {
                    let createJobResponse;
                    let getJobsFromService;

                    it('Create the job', async () => {
                        let validBody = {
                            test_id: testId,
                            arrival_rate: 1,
                            parallelism: 2,
                            duration: 1,
                            environment: 'test',
                            run_immediately: true,
                            max_virtual_users: 100,
                            proxy_url: 'http://proxy.com',
                            debug: '*'
                        };

                        createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                            'Content-Type': 'application/json'
                        });

                        should(createJobResponse.status).eql(201);
                        should(createJobResponse.body).containEql(expectedResult);
                    });

                    it('Get the job', async () => {
                        jobId = createJobResponse.body.id;
                        getJobsFromService = await schedulerRequestCreator.getJob(jobId, {
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(200);
                        should(getJobsFromService.body).containEql(expectedResult);
                    });

                    it('Verify docker is running', async () => {
                        let containers = await docker.listContainers();
                        containers = containers.filter(container => {
                            return container.Names && container.Names[0] &&
                                container.Names[0].includes(createJobResponse.body.id) &&
                                container.Names[0].includes(createJobResponse.body.run_id);
                        });

                        should(containers.length).eql(2);
                    });

                    it('Get logs', async () => {
                        let logs = await schedulerRequestCreator.getLogs(createJobResponse.body.id, createJobResponse.body.run_id, {});
                        should(logs.status).eql(200);
                        should(logs.headers['content-type']).eql('application/zip');
                    });

                    it('Stop run', async () => {
                        let stopRunResponse = await schedulerRequestCreator.stopRun(createJobResponse.body.id, createJobResponse.body.run_id, {
                            'Content-Type': 'application/json'
                        });

                        should(stopRunResponse.status).eql(204);
                    });

                    it('Delete job', async () => {
                        let deleteJobResponse = await schedulerRequestCreator.deleteJobFromScheduler(jobId);
                        should(deleteJobResponse.status).eql(204);

                        jobId = createJobResponse.body.id;
                        getJobsFromService = await schedulerRequestCreator.getJob(jobId, {
                            'Content-Type': 'application/json'
                        });

                        should(getJobsFromService.status).eql(404);
                    });

                    it('Verify containers exists', async () => {
                        let containers = await docker.listContainers();
                        containers = containers.filter(container => {
                            return container.Names && container.Names[0] &&
                                container.Names[0].includes('predator.');
                        });
                        should(containers.length).eql(2);
                    });

                    it('Wait for 5 seconds to let predator runner finish', (done) => {
                        setTimeout(done, 5000);
                    });

                    it('Delete containers', async () => {
                        let deleteJobResponse = await schedulerRequestCreator.deletePredatorRunnerContainers();
                        should(deleteJobResponse.status).eql(200);
                        should(deleteJobResponse.body.deleted).eql(2);

                        let containers = await docker.listContainers();
                        containers = containers.filter(container => {
                            return container.Names && container.Names[0] &&
                                container.Names[0].includes('predator-runner');
                        });
                        should(containers.length).eql(0, 'expecting all containers to be deleted');
                    });
                });
            });
        });
    }
});
