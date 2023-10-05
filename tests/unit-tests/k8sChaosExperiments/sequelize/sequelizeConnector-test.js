'use strict';
const sinon = require('sinon'),
    should = require('should'),
    databaseConfig = require('../../../../src/config/databaseConfig'),
    sequelizeConnector = require('../../../../src/chaos-experiments/models/database/sequelize/sequelizeConnector');

describe('Sequelize client tests', function () {
    const experimentRaw = {
        id: '4321',
        kubeObject: {
            kind: 'PodChaos',
            apiVersion: 'chaos-mesh.org/v1alpha1',
            metadata: {
                namespace: 'apps',
                name: 'second pod fault',
                annotations: {}
            },
            spec: {}
        },
        name: 'mickey2'
    };
    const experiment = {
        get: () => {
            return {
                experimentRaw
            };
        }
    };

    Object.assign(experiment, experimentRaw);

    const jobExperimentRaw = {
        id: '99998888',
        job_id: 'job1',
        experiment_id: '4321',
        start_time: 1695115585,
        end_time: 1695115620
    };

    const jobExperiment = {
        get: () => {
            return {
                jobExperimentRaw
            };
        }
    };

    Object.assign(jobExperiment, jobExperimentRaw);

    let sandbox,
        sequelizeModelStub,
        sequelizeDeleteStub,
        sequelizeDefineStub,
        sequelizeGeValueStub,
        sequelizeGetStub,
        sequelizeCreateStub,
        sequelizeUpdateStub;

    before(async () => {
        sandbox = sinon.sandbox.create();
    });

    beforeEach(async () => {
        databaseConfig.type = 'SQLITE';
        databaseConfig.name = 'predator';
        databaseConfig.username = 'username';
        databaseConfig.password = 'password';

        sequelizeModelStub = sandbox.stub();
        sequelizeDefineStub = sandbox.stub();
        sequelizeGetStub = sandbox.stub();
        sequelizeDeleteStub = sandbox.stub();
        sequelizeGeValueStub = sandbox.stub();
        sequelizeCreateStub = sandbox.stub();
        sequelizeUpdateStub = sandbox.stub();

        sequelizeDefineStub.returns({
            hasMany: () => {
            },
            sync: () => {
            }
        });

        sequelizeModelStub.returns({
            key: {},
            value: {},
            findAll: sequelizeGetStub,
            findOne: sequelizeGeValueStub,
            destroy: sequelizeDeleteStub,
            create: sequelizeCreateStub
        });

        await sequelizeConnector.init({
            model: sequelizeModelStub,
            define: sequelizeDefineStub
        });
    });

    afterEach(() => {
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    describe('Get ChaosExperiments', () => {
        it('Validate sequelize passed arguments', async () => {
            const limit = 25;
            const offset = 10;
            await sequelizeConnector.getAllChaosExperiments(offset, limit);
            should(sequelizeGetStub.calledOnce).eql(true);
            should(sequelizeGetStub.args[0][0]).containDeep({ offset, limit });
        });

        it('Validate sequelize passed arguments with excluding kubeObject', async () => {
            const limit = 25;
            const offset = 10;
            await sequelizeConnector.getAllChaosExperiments(offset, limit, 'kubeObject');
            should(sequelizeGetStub.calledOnce).eql(true);
            should(sequelizeGetStub.args[0][0]).containDeep({ offset, limit, attributes: { exclude: ['kubeObject'] } });
        });
    });
    describe('Get specific chaos experiments', () => {
        describe('getChaosExperimentById', function() {
            it('Validate sequelize passed arguments', async () => {
                sequelizeGetStub.returns([experiment]);
                const experimentId = experimentRaw.id;
                await sequelizeConnector.getChaosExperimentById(experimentId);
                should(sequelizeGetStub.calledOnce).eql(true);
                should(sequelizeGetStub.args[0][0]).containDeep({ where: { id: experimentId } });
            });
        });
        describe('getChaosExperimentByName', function() {
            it('Validate sequelize passed arguments', async () => {
                sequelizeGetStub.returns([experiment]);
                const experimentName = experiment.name;
                await sequelizeConnector.getChaosExperimentByName(experimentName);
                should(sequelizeGetStub.calledOnce).eql(true);
                should(sequelizeGetStub.args[0][0]).containDeep({ where: { name: experimentName } });
            });
        });
        describe('Get ChaosExperimentsById', () => {
            it('Validate sequelize passed arguments', async () => {
                sequelizeGetStub.returns([experiment]);
                const experimentIds = ['1234', '4321'];
                await sequelizeConnector.getChaosExperimentsByIds(experimentIds);
                should(sequelizeGetStub.calledOnce).eql(true);
                should(sequelizeGetStub.args[0][0]).containDeep({ where: { id: experimentIds } });
            });

            it('Validate sequelize passed arguments with excluding kubeObject', async () => {
                sequelizeGetStub.returns([experiment]);
                const experimentIds = ['1234', '4321'];
                await sequelizeConnector.getChaosExperimentsByIds(experimentIds, 'kubeObject');
                should(sequelizeGetStub.calledOnce).eql(true);
                should(sequelizeGetStub.args[0][0]).containDeep(
                    { where: { id: experimentIds } },
                    { exclude: ['kubeObject'] }
                );
            });
        });
    });

    describe('Insert a chaos experiment', () => {
        it('Happy flow', async () => {
            await sequelizeConnector.insertChaosExperiment(experiment.id, experiment);
            const paramsArg = sequelizeCreateStub.args[0][0];
            should(sequelizeCreateStub.calledOnce).eql(true);
            should(paramsArg).containDeep(experimentRaw);
            should(paramsArg).has.properties(['created_at', 'updated_at']);
        });
    });

    describe('Delete chaos experiment', () => {
        it('validate query', async () => {
            const experimentId = 'A-B-C';
            await sequelizeConnector.deleteChaosExperiment(experimentId);
            should(sequelizeDeleteStub.args[0][0]).deepEqual({ where: { id: experimentId } });
        });
    });

    describe('Updating chaos experiment', () => {
        it('updating kubeObject', async () => {
            const experimentId = 'A-C-B';
            const updatedExperiment = {
                kubeObject: {
                    kind: 'PodChaos',
                    apiVersion: 'chaos-mesh.org/v2alpha2',
                    metadata: {
                        namespace: 'apps',
                        name: 'second pod fault',
                        annotations: {}
                    },
                    spec: {}
                },
                name: 'mickey2',
                updated_at: Date.now(),
                created_at: Date.now()
            };
            sequelizeModelStub.returns({ update: sequelizeUpdateStub });
            await sequelizeConnector.updateChaosExperiment(experimentId, updatedExperiment);
            should(sequelizeUpdateStub.calledOnce).equal(true);
            should(sequelizeUpdateStub.args[0][0].updated_at).greaterThanOrEqual(updatedExperiment.updated_at);
            should(sequelizeUpdateStub.args[0][0].kubeObject).equal(updatedExperiment.kubeObject);
            should(sequelizeUpdateStub.args[0][1].where.id).equal(experimentId);
        });
    });

    describe('Insert a chaos job experiment', () => {
        it('Happy flow', async () => {
            await sequelizeConnector.insertChaosJobExperiment(jobExperimentRaw.id, jobExperimentRaw.job_id, jobExperimentRaw.experiment_id, jobExperimentRaw.start_time, jobExperimentRaw.end_time);
            const paramsArg = sequelizeCreateStub.args[0][0];
            should(sequelizeCreateStub.calledOnce).eql(true);
            should(paramsArg).containDeep(jobExperimentRaw);
            should(paramsArg).has.properties(['start_time', 'end_time']);
        });
    });
    describe('Get specific chaos job experiments', () => {
        describe('getChaosJobExperimentById', function() {
            it('Validate sequelize passed arguments', async () => {
                sequelizeGetStub.returns([jobExperiment]);
                const jobExperimentId = jobExperiment.id;
                await sequelizeConnector.getChaosJobExperimentById(jobExperimentId);
                should(sequelizeGetStub.calledOnce).eql(true);
                should(sequelizeGetStub.args[0][0]).containDeep({ where: { id: jobExperimentId } });
            });
        });
        describe('getChaosJobExperimentByJobId', function() {
            it('Validate sequelize passed arguments', async () => {
                sequelizeGetStub.returns([jobExperiment]);
                const experimentJobId = experiment.job_id;
                await sequelizeConnector.getChaosJobExperimentByJobId(experimentJobId);
                should(sequelizeGetStub.calledOnce).eql(true);
                should(sequelizeGetStub.args[0][0]).containDeep({ where: { job_id: experimentJobId } });
            });
        });
    });

    describe('Set job experiment is triggered', () => {
        describe('setChaosJobExperimentByTriggered', function() {
            it('Validate sequelize passed arguments', async () => {
                sequelizeModelStub.returns({ update: sequelizeUpdateStub });
                sequelizeUpdateStub.returns([{ ...jobExperiment, is_triggered: true }]);
                const jobExperimentId = jobExperiment.id;
                await sequelizeConnector.setChaosJobExperimentTriggered(jobExperimentId, true);
                should(sequelizeUpdateStub.calledOnce).eql(true);
                should(sequelizeUpdateStub.args[0][0]).containDeep({ is_triggered: true });
                should(sequelizeUpdateStub.args[0][1]).containDeep({ where: { id: jobExperimentId } });
            });
        });
    });
});
