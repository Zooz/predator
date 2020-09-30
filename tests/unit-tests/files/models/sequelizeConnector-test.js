
const should = require('should'),
    sinon = require('sinon'),
    rewire = require('rewire'),
    sequelizeConnector = rewire('../../../../src/files/models/database/sequelize/sequelizeConnector'),
    uuid = require('uuid');

describe('Testing sequelize connector', function () {
    let sandbox, sequelizeStub,
        syncStub,
        createStub,
        destroyStub,
        findStub,
        authenticateStub,
        findAllStub,
        updateStub;
    before(async function () {
        sandbox = sinon.sandbox.create();
        syncStub = sandbox.stub();
        createStub = sandbox.stub();
        findStub = sandbox.stub();
        findAllStub = sandbox.stub();
        updateStub = sandbox.stub();
        authenticateStub = sandbox.stub();
        destroyStub = sandbox.stub();
        sequelizeStub = {
            authenticate: authenticateStub,
            model: sandbox.stub().returns({
                create: createStub,
                findAll: findAllStub,
                destroy: destroyStub,
                update: updateStub,
                findOne: findStub
            }),
            define: sandbox.stub().returns({ sync: syncStub })
        };
        sequelizeStub.DataTypes = { UUID: 'uuid', STRING: 'string', DATE: 'date', TEXT: () => ('long') };
        sequelizeConnector.__set__('Sequelize', sequelizeStub);
        await sequelizeConnector.init(sequelizeStub);
        sandbox.stub(uuid, 'v4').returns('uuid');
    });
    beforeEach(function () {
        createStub.resolves();
        authenticateStub.resolves();
        sandbox.resetHistory();
    });
    after(function () {
        sandbox.restore();
    });
    describe('handle file insert and get', function () {
        it('when succeed insert file', async function () {
            const fileId = uuid();
            await sequelizeConnector.saveFile(fileId, 'data.csv', 'File for test content');
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['file']]);
            should(createStub.args[0][0].id).eql(fileId);
            should(createStub.args[0][0].file).eql('File for test content');
            should(createStub.args[0][0].name).eql('data.csv');
        });
        it('when fail to insert file', async function () {
            const error = new Error('error');
            createStub.rejects(error);
            const fileId = uuid();
            try {
                await sequelizeConnector.saveFile(fileId, 'data.csv', 'File for test content');
                throw new Error('should not get here');
            } catch (err) {
                should(err).eql(error);
            }
        });
        it('when succeed to get file', async function () {
            findStub.returns({ file: 'mickey the predator', name: 'mickey.csv' });
            const fileId = uuid();
            const file = await sequelizeConnector.getFile(fileId);
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['file']]);
            should(findStub.getCall(0).args[0].where.id).eql(fileId);

            should(file.name).eql('mickey.csv');
            should(file.file).eql('mickey the predator');
        });
        it('when fail to get file', async function () {
            const error = new Error('error');
            findStub.rejects(error);
            const fileId = uuid();
            try {
                await sequelizeConnector.getFile(fileId);
                throw new Error('should not get here');
            } catch (err) {
                should(err).eql(error);
            }
        });
    });
});
