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

        const requestBody = require('../../testExamples/Basic_test');
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
                const isMatch = body.spec.template.spec.containers['0'].env.find(o => o.name === 'TEST_ID').value === updatedTestId;
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
            const date = new Date();
            date.setSeconds(date.getSeconds() + 2);
            const validBody = {
                test_id: testId,
                arrival_rate: 1,
                duration: 1,
                type: 'load_test',
                environment: 'test',
                run_immediately: false,
                cron_expression: date.getSeconds() + ' * * * * *',
                webhooks: ['http://www.hello.com', 'https://www.zooz.com'],
                emails: ['email@me.com', 'hello@zooz']
            };
            const createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                'Content-Type': 'application/json'
            });
            jobId = createJobResponse.body.id;

            const getJobResponseBeforeUpdate = await schedulerRequestCreator.getJob(jobId, {
                'Content-Type': 'application/json'
            });
            getJobResponseBeforeUpdate.body.test_id.should.eql(testId);

            const updateJobResponse = await schedulerRequestCreator.updateJob(jobId, { test_id: updatedTestId }, {
                'Content-Type': 'application/json'
            });
            should(updateJobResponse.statusCode).eql(200);

            const getJobResponseAfterUpdate = await schedulerRequestCreator.getJob(jobId, {
                'Content-Type': 'application/json'
            });

            const expectedResponseBodyAfterUpdate = JSON.parse(JSON.stringify(getJobResponseBeforeUpdate.body));
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
                const isMatch = body.spec.template.spec.containers['0'].env.find(o => o.name === 'TEST_ID').value === testId;
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
            const validBody = {
                test_id: testId,
                arrival_rate: 1,
                type: 'load_test',
                duration: 1,
                environment: 'test',
                run_immediately: false,
                cron_expression: '* ' + date.getHours() + ' * * * *'
            };
            const createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                'Content-Type': 'application/json'
            });
            jobId = createJobResponse.body.id;
            date = new Date();
            date.setSeconds(date.getSeconds() + 2);
            const updateJobResponse = await schedulerRequestCreator.updateJob(jobId, { cron_expression: date.getSeconds() + ' * * * * *' }, {
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
            const date = new Date();
            date.setHours(date.getHours() + 2);
            const validBody = {
                test_id: testId,
                arrival_rate: 1,
                duration: 1,
                type: 'load_test',
                environment: 'test',
                run_immediately: false,
                cron_expression: '* ' + date.getHours() + ' * * * *',
                webhooks: [],
                emails: ['b@emails.com']
            };
            const createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                'Content-Type': 'application/json'
            });
            jobId = createJobResponse.body.id;
        });

        it('Update the job', async () => {
            const date = new Date();

            date.setHours(date.getHours() + 3);
            updatedCronExpression = `* ${date.getHours()} * * * * *`;

            const updateJobResponse = await schedulerRequestCreator.updateJob(jobId,
                {
                    cron_expression: updatedCronExpression,
                    arrival_count: 5,
                    duration: 30,
                    environment: 'updated env',
                    enabled: false,
                    type: 'functional_test'
                },
                {
                    'Content-Type': 'application/json'
                });
            updateJobResponse.statusCode.should.eql(200);
        });

        it('Verify job updated as expected', async () => {
            const getJobResponseAfterUpdate = await schedulerRequestCreator.getJob(jobId, {
                'Content-Type': 'application/json'
            });

            should(getJobResponseAfterUpdate.body).eql({
                id: jobId,
                test_id: testId,
                type: 'functional_test',
                cron_expression: updatedCronExpression,
                emails: ['b@emails.com'],
                arrival_count: 5,
                duration: 30,
                environment: 'updated env',
                enabled: false
            });
        });

        it('Delete job', async () => {
            schedulerRequestCreator.deleteJobFromScheduler(jobId);
        });
    });

    describe('Unsuccessful Updates', () => {
        let jobId, functionalJobId;
        before(() => {
            nock.cleanAll();
        });

        before(async () => {
            const validBody = {
                test_id: testId,
                arrival_rate: 1,
                duration: 1,
                type: 'load_test',
                environment: 'test',
                run_immediately: false,
                cron_expression: '* * * * * *'
            };
            const createJobResponse = await schedulerRequestCreator.createJob(validBody, {
                'Content-Type': 'application/json'
            });
            jobId = createJobResponse.body.id;

            const validFunctionalJobBody = {
                test_id: testId,
                arrival_count: 1,
                duration: 1,
                type: 'functional_test',
                environment: 'test',
                run_immediately: false,
                cron_expression: '* * * * * *'
            };
            const createFunctionalJobResponse = await schedulerRequestCreator.createJob(validFunctionalJobBody, {
                'Content-Type': 'application/json'
            });
            functionalJobId = createFunctionalJobResponse.body.id;
        });

        it('Update job with wrong type', async () => {
            const updateJobResponse = await schedulerRequestCreator.updateJob(jobId, { type: 'mickey' }, {
                'Content-Type': 'application/json'
            });
            updateJobResponse.statusCode.should.eql(400);
            updateJobResponse.body.should.eql({ message: 'job type is in an unsupported value: mickey' });
        });

        it('Update load_test job to functional_test with arrival_rate', async () => {
            const updateJobResponse = await schedulerRequestCreator.updateJob(jobId, { type: 'functional_test', arrival_rate: 5 }, {
                'Content-Type': 'application/json'
            });
            updateJobResponse.statusCode.should.eql(400);
            updateJobResponse.body.should.eql({ message: 'arrival_count is mandatory when updating job to functional_test' });
        });

        it('Update functional_test job to load_test with arrival_count', async () => {
            const updateJobResponse = await schedulerRequestCreator.updateJob(functionalJobId, { type: 'load_test', arrival_count: 5 }, {
                'Content-Type': 'application/json'
            });
            updateJobResponse.statusCode.should.eql(400);
            updateJobResponse.body.should.eql({ message: 'arrival_rate is mandatory when updating job to load_test' });
        });

        it('Update job with non existing test id', async () => {
            const nonExistingTestId = '56ccc314-8c92-4002-839d-8424909ff475';
            const updateJobResponse = await schedulerRequestCreator.updateJob(jobId, { test_id: nonExistingTestId }, {
                'Content-Type': 'application/json'
            });
            updateJobResponse.statusCode.should.eql(400);
            updateJobResponse.body.should.eql({ message: `test with id: ${nonExistingTestId} does not exist` });
        });

        it('Try to update enabled to not boolean', async () => {
            const updateJobResponse = await schedulerRequestCreator.updateJob(jobId, { enabled: 'NOT_BOOLEAN' }, {
                'Content-Type': 'application/json'
            });
            updateJobResponse.statusCode.should.eql(400);
            updateJobResponse.body.should.eql({
                message: 'Input validation error',
                validation_errors: ['body/enabled should be boolean']
            });
        });

        it('Delete job', async () => {
            await schedulerRequestCreator.deleteJobFromScheduler(jobId);
        });
    });
});
