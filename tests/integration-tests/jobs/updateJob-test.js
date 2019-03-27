'use strict';

const schedulerRequestCreator = require('./helpers/requestCreator'),
    testsRequestCreator = require('../tests/helpers/requestCreator'),
    should = require('should'),
    nock = require('nock'),
    kubernetesConfig = require('../../../src/config/kubernetesConfig');

describe('Update scheduled job', function () {
    this.timeout(20000);
    let testId;
    let updatedTestId;

    before(async () => {
        await schedulerRequestCreator.init();
        await testsRequestCreator.init();

        let requestBody = require('../../testExamples/Basic_test');
        let response = await testsRequestCreator.createTest(requestBody, {});
        should(response.statusCode).eql(201);
        should(response.body).have.key('id');
        testId = response.body.id;

        response = await testsRequestCreator.createTest(requestBody, {});
        should(response.statusCode).eql(201);
        should(response.body).have.key('id');
        updatedTestId = response.body.id;
    });

    describe.skip('Update test id', () => {
        let jobId;
        let runsWithUpdatedTestId = 0;

        before(async () => {
            nock.cleanAll();

            nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`, body => {
                let isMatch = body.spec.template.spec.containers['0'].env.find(o => o.name === 'TEST_ID').value === updatedTestId;
                return isMatch;
            }).reply(200,
                () => {
                    runsWithUpdatedTestId++;
                    return {
                        metadata: { name: 'jobName', uid: 'uid' },
                        namespace: kubernetesConfig.kubernetesNamespace
                    };
                });
        });

        it('Create a job then update it', async () => {
            let date = new Date();
            date.setSeconds(date.getSeconds() + 2);
            let validBody = {
                test_id: testId,
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                run_immediately: false,
                cron_expression: date.getSeconds() + ' * * * * *',
                webhooks: ['http://www.hello.com', 'https://www.zooz.com'],
                emails: ['email@me.com', 'hello@zooz']
            };
            let createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                'Content-Type': 'application/json'
            });
            jobId = createJobResponse.body.id;

            let getJobResponseBeforeUpdate = await schedulerRequestCreator.getJob(jobId, {
                'Content-Type': 'application/json'
            });
            getJobResponseBeforeUpdate.body.test_id.should.eql(testId);

            let updateJobResponse = await schedulerRequestCreator.updateJob(jobId, { test_id: updatedTestId }, {
                'Content-Type': 'application/json'
            });
            should(updateJobResponse.statusCode).eql(200);

            let getJobResponseAfterUpdate = await schedulerRequestCreator.getJob(jobId, {
                'Content-Type': 'application/json'
            });

            let expectedResponseBodyAfterUpdate = JSON.parse(JSON.stringify(getJobResponseBeforeUpdate.body));
            expectedResponseBodyAfterUpdate.test_id = updatedTestId;
            getJobResponseAfterUpdate.body.should.eql(expectedResponseBodyAfterUpdate);
        });

        it('Wait for 4 seconds', (done) => {
            setTimeout(done, 4000);
        });

        it('Validate test updated', () => {
            should(runsWithUpdatedTestId).eql(1);
        });

        it('Delete job', async () => {
            await schedulerRequestCreator.deleteJobFromScheduler(jobId);
        });
    });

    describe.skip('Update cron', () => {
        before(() => {
            nock.cleanAll();
        });

        let jobId;
        let runsWithTestId = 0;

        before(async () => {
            nock(kubernetesConfig.kubernetesUrl).post(`/apis/batch/v1/namespaces/${kubernetesConfig.kubernetesNamespace}/jobs`, body => {
                let isMatch = body.spec.template.spec.containers['0'].env.find(o => o.name === 'TEST_ID').value === testId;
                return isMatch;
            }).reply(200,
                () => {
                    runsWithTestId++;
                    return {
                        metadata: { name: 'jobName', uid: 'uid' },
                        namespace: kubernetesConfig.kubernetesNamespace
                    };
                });
        });

        it('Create a job then update it\'s cron', async () => {
            let date = new Date();
            date.setHours(date.getHours() + 2);
            let validBody = {
                test_id: testId,
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                run_immediately: false,
                cron_expression: '* ' + date.getHours() + ' * * * *'
            };
            let createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                'Content-Type': 'application/json'
            });
            jobId = createJobResponse.body.id;
            date = new Date();
            date.setSeconds(date.getSeconds() + 2);
            let updateJobResponse = await schedulerRequestCreator.updateJob(jobId, { cron_expression: date.getSeconds() + ' * * * * *' }, {
                'Content-Type': 'application/json'
            });
            updateJobResponse.statusCode.should.eql(200);
        });

        it('Wait for 4 seconds', (done) => {
            setTimeout(done, 4000);
        });

        it('Validate test updated', async () => {
            should(runsWithTestId).eql(1);
        });
        it('Delete job', async () => {
            schedulerRequestCreator.deleteJobFromScheduler(jobId);
        });
    });

    describe('Update all allowed test params', () => {
        before(() => {
            nock.cleanAll();
        });

        let jobId;
        let updatedCronExpression;

        it('Create a job', async () => {
            let date = new Date();
            date.setHours(date.getHours() + 2);
            let validBody = {
                test_id: testId,
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                run_immediately: false,
                cron_expression: '* ' + date.getHours() + ' * * * *',
                webhooks: ['a@webhooks.com'],
                emails: ['b@emails.com']
            };
            let createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                'Content-Type': 'application/json'
            });
            jobId = createJobResponse.body.id;
        });

        it('Update the job', async () => {
            let date = new Date();

            date.setHours(date.getHours() + 3);
            updatedCronExpression = `* ${date.getHours()} * * * * *`;

            let updateJobResponse = await schedulerRequestCreator.updateJob(jobId,
                {
                    cron_expression: updatedCronExpression,
                    arrival_rate: 10,
                    ramp_to: 20,
                    duration: 30,
                    environment: 'updated env'
                },
                {
                    'Content-Type': 'application/json'
                });
            updateJobResponse.statusCode.should.eql(200);
        });

        it('Verify job updated as expected', async () => {
            let getJobResponseAfterUpdate = await schedulerRequestCreator.getJob(jobId, {
                'Content-Type': 'application/json'
            });

            should(getJobResponseAfterUpdate.body).eql({
                id: jobId,
                test_id: testId,
                cron_expression: updatedCronExpression,
                webhooks: ['a@webhooks.com'],
                emails: ['b@emails.com'],
                ramp_to: 20,
                arrival_rate: 10,
                duration: 30,
                environment: 'updated env'
            });
        });

        it('Delete job', async () => {
            schedulerRequestCreator.deleteJobFromScheduler(jobId);
        });
    });

    describe('Unsuccessful Updates', () => {
        let jobId;
        before(() => {
            nock.cleanAll();
        });

        before(async () => {
            let validBody = {
                test_id: testId,
                arrival_rate: 1,
                duration: 1,
                environment: 'test',
                run_immediately: false,
                cron_expression: '* * * * * *'
            };
            let createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                'Content-Type': 'application/json'
            });
            jobId = createJobResponse.body.id;
        });

        it('Update job with not existing column', async () => {
            let updateJobResponse = await schedulerRequestCreator.updateJob(jobId, { something: 'something' }, {
                'Content-Type': 'application/json'
            });
            updateJobResponse.statusCode.should.eql(200);
        });

        it('Update job with non existing test id', async () => {
            let nonExistingTestId = '56ccc314-8c92-4002-839d-8424909ff475';
            let updateJobResponse = await schedulerRequestCreator.updateJob(jobId, { test_id: nonExistingTestId }, {
                'Content-Type': 'application/json'
            });
            updateJobResponse.statusCode.should.eql(400);
            updateJobResponse.body.should.eql({ message: `test with id: ${nonExistingTestId} does not exist` });
        });

        it('Try to update the job Id', async () => {
            let updateJobResponse = await schedulerRequestCreator.updateJob(jobId, { job_id: 'some job id' }, {
                'Content-Type': 'application/json'
            });
            updateJobResponse.statusCode.should.eql(200);
        });

        it('Try to update the id', async () => {
            let updateJobResponse = await schedulerRequestCreator.updateJob(jobId, { id: 'some job id' }, {
                'Content-Type': 'application/json'
            });
            updateJobResponse.statusCode.should.eql(200);
        });

        it('Delete job', async () => {
            await schedulerRequestCreator.deleteJobFromScheduler(jobId);
        });
    });
});
