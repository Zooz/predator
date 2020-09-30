const sinon = require('sinon'),
    should = require('should'),
    logger = require('../../src/common/logger'),
    rewire = require('rewire');

let logErrorStub, sandbox;

const MANDATORY_VARS = [
    'MY_ADDRESS',
    'DATABASE_NAME',
    'DATABASE_ADDRESS',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD'
];

const SMTP_MANDATORY_VARS = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USERNAME',
    'SMTP_PASSWORD'
];

describe.skip('Env Suite', function () {
    before(() => {
        sandbox = sinon.sandbox.create();
        sandbox.stub(process, 'exit');
        logErrorStub = sandbox.stub(logger, 'error');
        sandbox.stub(process, 'on');
    });

    beforeEach(() => {
        process.env.MY_ADDRESS = 'MY_ADDRESS';
        process.env.DATABASE_NAME = 'DATABASE_NAME';
        process.env.DATABASE_ADDRESS = 'DATABASE_ADDRESS';
        process.env.DATABASE_USERNAME = 'DATABASE_USERNAME';
        process.env.DATABASE_PASSWORD = 'DATABASE_PASSWORD';
        process.env.DATABASE_TYPE = 'POSTGRES';
    });

    afterEach(() => {
        SMTP_MANDATORY_VARS.forEach((varb) => {
            delete process.env[varb];
        });
        sandbox.reset();
    });

    after(() => {
        sandbox.restore();
    });

    describe('Check when all fields missing', () => {
        before(function () {
            const env = rewire('../../src/env.js');
            MANDATORY_VARS.forEach(function (varb) {
                delete process.env[varb];
            });

            env.init();
        });

        it('Should Failed - missing all mandatory env', () => {
            should(logErrorStub.called).eql(true);
            should(logErrorStub.args[0][0]).eql('DATABASE_TYPE should be one of: MYSQL,POSTGRES,MSSQL,SQLITE');
        });

        MANDATORY_VARS.forEach(function (varb) {
            describe(varb + ' field is missing', () => {
                before(() => {
                    delete process.env[varb];
                    const env = rewire('../../src/env.js');
                    env.init();
                });

                it('Should Failed - missing mandatory env', () => {
                    should(logErrorStub.called).eql(true);
                    should(logErrorStub.args[0][0]).eql('Missing mandatory environment variables');
                    should(logErrorStub.args[0][1]).eql([varb]);
                });
            });
        });
    });

    describe('With SMTP', function () {
        SMTP_MANDATORY_VARS.forEach(function (varb) {
            if (varb !== 'SMTP_HOST') {
                describe(varb + ' field is missing', () => {
                    beforeEach(() => {
                        process.env.SMTP_HOST = 'SMTP_HOST';
                        process.env.SMTP_PORT = 'SMTP_PORT';
                        process.env.SMTP_USERNAME = 'SMTP_USERNAME';
                        process.env.SMTP_PASSWORD = 'SMTP_PASSWORD';

                        delete process.env[varb];
                        const env = rewire('../../src/env.js');
                        env.init();
                    });

                    it('Should Failed - missing mandatory env', () => {
                        should(logErrorStub.called).eql(true);
                        should(logErrorStub.args[0][0]).eql('Missing mandatory environment variables');
                        should(logErrorStub.args[0][1]).eql([varb]);
                    });
                });
            }
        });
    });

    describe('Successful Init Success', function () {
        before(function () {
            const env = rewire('../../src/env.js');
            env.init();
        });

        it('Validate log error not called', function () {
            should(logErrorStub.called).eql(false);
        });
    });
});
