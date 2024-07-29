const sinon = require('sinon'),
    rewire = require('rewire'),
    should = require('should'),
    jobExperimentHandler = require('../../../../../src/jobs/models/kubernetes/jobExperimentsHandler'),
    chaosExperimentsManager = require('../../../../../src/chaos-experiments/models/chaosExperimentsManager');
const { v4: uuid } = require('uuid');

function generateExperiment(id = uuid()){
    return {
        id: id,
        kubeObject: {
            kind: 'PodChaos',
            apiVersion: 'chaos-mesh.org/v1alpha1',
            metadata: {
                name: 'TestChaos'
            },
            spec: {
                mode: 'all',
                action: 'pod-kill',
                duration: '1m'
            }
        }

    };
}
describe('Job experiments handler tests', function () {
    let experimentsManagerInsertStub;
    let experimentsManagerGetStub;
    let experimentsManagerRunJobStub;
    let stopJobExperimentsByJobIdStub;
    let clearAllFinishedResourcesStub;
    let sandbox;
    let clock;

    before(() => {
        sandbox = sinon.sandbox.create();
        experimentsManagerInsertStub = sandbox.stub(chaosExperimentsManager, 'insertChaosJobExperiment');
        experimentsManagerGetStub = sandbox.stub(chaosExperimentsManager, 'getChaosExperimentsByIds');
        experimentsManagerRunJobStub = sandbox.stub(chaosExperimentsManager, 'runChaosExperiment');
        stopJobExperimentsByJobIdStub = sandbox.stub(chaosExperimentsManager, 'stopJobExperimentsByJobId');
        clearAllFinishedResourcesStub = sandbox.stub(chaosExperimentsManager, 'clearAllFinishedResources');
    });
    beforeEach(async () => {
        sandbox.reset();
    });

    afterEach(async () => {
        if (clock){
            clock.restore();
            clock = undefined;
        }
    });

    after(() => {
        sandbox.restore();
    });

    describe('Set experiments if exist tests', function () {
        it('set chaos experiments with 2 experiments', async () => {
            const firstExperiment = generateExperiment();
            const secondExperiment = generateExperiment();
            const firstExperimentName = firstExperiment.kubeObject.metadata.name;
            experimentsManagerInsertStub.resolves();
            experimentsManagerGetStub.resolves([firstExperiment, secondExperiment]);
            experimentsManagerRunJobStub.resolves();
            const jobExperiments = [
                {
                    experiment_id: firstExperiment.id,
                    start_after: 60
                },
                {
                    experiment_id: secondExperiment.id,
                    start_after: 120
                }
            ];
            const jobId = uuid();
            clock = sinon.useFakeTimers();
            clock.tick(1000);
            await jobExperimentHandler.setChaosExperimentsIfExist(jobId, jobExperiments);
            clock.tick(60 * 1000 * 2);
            (experimentsManagerRunJobStub.callCount).should.eql(2);
            experimentsManagerRunJobStub.args[0][0].metadata.name.should.eql(`${firstExperimentName}-${experimentsManagerRunJobStub.args[0][2]}`);
            experimentsManagerGetStub.callCount.should.eql(1);
            experimentsManagerInsertStub.callCount.should.eql(2);
            experimentsManagerInsertStub.args[0][1].should.eql(jobId);
            experimentsManagerInsertStub.args[0][2].should.eql(firstExperiment.id);
            (experimentsManagerInsertStub.args[0][4] - experimentsManagerInsertStub.args[0][3]).should.eql(60000);
            experimentsManagerInsertStub.args[1][1].should.eql(jobId);
            experimentsManagerInsertStub.args[1][2].should.eql(secondExperiment.id);
            (experimentsManagerInsertStub.args[1][3] - experimentsManagerInsertStub.args[0][3]).should.eql(60000);
        });

        it('set chaos experiments with same experiment in different times', async () => {
            const experiment = generateExperiment();
            experimentsManagerInsertStub.resolves();
            experimentsManagerGetStub.resolves([experiment]);
            const jobExperiments = [
                {
                    experiment_id: experiment.id,
                    start_after: 60
                },
                {
                    experiment_id: experiment.id,
                    start_after: 120
                }
            ];
            const jobId = uuid();
            const clock = sinon.useFakeTimers();
            clock.tick(1000);
            await jobExperimentHandler.setChaosExperimentsIfExist(jobId, jobExperiments);
            clock.tick(3000);
            experimentsManagerGetStub.callCount.should.eql(1);
            experimentsManagerInsertStub.callCount.should.eql(2);
            experimentsManagerInsertStub.args[0][1].should.eql(jobId);
            experimentsManagerInsertStub.args[0][2].should.eql(experiment.id);
            (experimentsManagerInsertStub.args[0][4] - experimentsManagerInsertStub.args[0][3]).should.eql(60000);
            clock.restore();
        });

        it('set chaos experiments without experiments', async () => {
            await jobExperimentHandler.setChaosExperimentsIfExist(uuid(), []);
            experimentsManagerGetStub.callCount.should.eql(1);
            experimentsManagerInsertStub.callCount.should.eql(0);
        });
    });

    describe('Clear all finished job experiments', function () {
        it('should call experiments manager and return its response of deleted number', async () => {
            clearAllFinishedResourcesStub.resolves(3);
            const numberOfCleaned = await jobExperimentHandler.clearAllFinishedJobExperiments();
            clearAllFinishedResourcesStub.callCount.should.eql(1);
            numberOfCleaned.should.eql(3);
        });
    });

    describe('stop chaos experiments for job', function () {
        const jobExperimentHandlerRewire = rewire('../../../../../src/jobs/models/kubernetes/jobExperimentsHandler');
        it('timeouts should be removed from map, stopJobExperimentsByJobId should be called', async () => {
            const jobId = uuid();
            const map = new Map();
            const timeouts = [setTimeout(() => true, 10000), setTimeout(() => true, 50000)];
            map.set(jobId, timeouts);
            jobExperimentHandlerRewire.__set__('jobIdsToTimeouts', map);
            const checkMap = jobExperimentHandlerRewire.__get__('jobIdsToTimeouts', timeouts);
            should(checkMap.has(jobId)).be.eql(true);
            stopJobExperimentsByJobIdStub.resolves();
            await jobExperimentHandlerRewire.stopChaosExperimentsForJob(jobId);
            const updatedMap = jobExperimentHandlerRewire.__get__('jobIdsToTimeouts', timeouts);
            should(updatedMap.has(jobId)).be.eql(false);
            stopJobExperimentsByJobIdStub.callCount.should.eql(1);
        });
    });
});
