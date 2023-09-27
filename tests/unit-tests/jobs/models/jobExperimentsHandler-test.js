const sinon = require('sinon'),
    databaseConnector = require('../../../../src/chaos-experiments/models/database/databaseConnector'),
    jobExperimentHandler = require('../../../../src/jobs/models/jobExperimentsHandler'),
    chaosExperimentsManager = require('../../../../src/chaos-experiments/models/chaosExperimentsManager');
;
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
    let databaseConnectorInsertStub;
    let databaseConnectorGetStub;
    let experimentsManagerRunJobStub;
    let sandbox;

    before(() => {
        sandbox = sinon.sandbox.create();
        databaseConnectorInsertStub = sandbox.stub(databaseConnector, 'insertChaosJobExperiment');
        databaseConnectorGetStub = sandbox.stub(databaseConnector, 'getChaosExperimentsByIds');
        experimentsManagerRunJobStub = sandbox.stub(chaosExperimentsManager, 'runChaosExperiment');
    });
    beforeEach(async () => {
        sandbox.reset();
    });

    after(() => {
        sandbox.restore();
    });

    it('set chaos experiments with 2 experiments', async () => {
        const firstExperiment = generateExperiment();
        const secondExperiment = generateExperiment();
        databaseConnectorInsertStub.resolves();
        databaseConnectorGetStub.resolves([firstExperiment, secondExperiment]);
        experimentsManagerRunJobStub.resolves();
        const jobExperiments = [
            {
                experiment_id: firstExperiment.id,
                start_after: 1000
            },
            {
                experiment_id: secondExperiment.id,
                start_after: 2000
            }
        ];
        const jobId = uuid();
        const clock = sinon.useFakeTimers();
        clock.tick(2000);
        await jobExperimentHandler.setChaosExperimentsIfExist(jobId, jobExperiments);
        clock.tick(4000);
        experimentsManagerRunJobStub.callCount.should.eql(2);
        databaseConnectorGetStub.callCount.should.eql(1);
        databaseConnectorInsertStub.callCount.should.eql(2);
        databaseConnectorInsertStub.args[0][1].should.eql(jobId);
        databaseConnectorInsertStub.args[0][2].should.eql(firstExperiment.id);
        (databaseConnectorInsertStub.args[0][4] - databaseConnectorInsertStub.args[0][3]).should.eql(60000);
        databaseConnectorInsertStub.args[1][1].should.eql(jobId);
        databaseConnectorInsertStub.args[1][2].should.eql(secondExperiment.id);
        (databaseConnectorInsertStub.args[1][3] - databaseConnectorInsertStub.args[0][3]).should.eql(1000);
    });

    it('set chaos experiments with same experiment in different times', async () => {
        const experiment = generateExperiment();
        databaseConnectorInsertStub.resolves();
        databaseConnectorGetStub.resolves([experiment]);
        const jobExperiments = [
            {
                experiment_id: experiment.id,
                start_after: 1000
            },
            {
                experiment_id: experiment.id,
                start_after: 2000
            }
        ];
        const jobId = uuid();
        await jobExperimentHandler.setChaosExperimentsIfExist(jobId, jobExperiments);
        databaseConnectorGetStub.callCount.should.eql(1);
        databaseConnectorInsertStub.callCount.should.eql(2);
        databaseConnectorInsertStub.args[0][1].should.eql(jobId);
        databaseConnectorInsertStub.args[0][2].should.eql(experiment.id);
        (databaseConnectorInsertStub.args[0][4] - databaseConnectorInsertStub.args[0][3]).should.eql(60000);
    });

    it('set chaos experiments with no experiments', async () => {
        await jobExperimentHandler.setChaosExperimentsIfExist(uuid(), []);
        databaseConnectorGetStub.callCount.should.eql(1);
        databaseConnectorInsertStub.callCount.should.eql(0);
    });
});