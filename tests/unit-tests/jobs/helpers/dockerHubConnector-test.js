const sinon = require('sinon'),
    rewire = require('rewire'),
    should = require('should'),
    requestSender = require('../../../../src/common/requestSender');

let dockerHubConnector;

describe('Docker hub connector tests', () => {
    let sandbox, requestSenderSendStub;

    before(() => {
        sandbox = sinon.createSandbox();
        requestSenderSendStub = sandbox.stub(requestSender, 'send');
        dockerHubConnector = rewire('../../../../src/jobs/models/dockerHubConnector');
    });

    beforeEach(() => {
        dockerHubConnector.__set__('configHandler', {
            getConfig: () => {
                return { docker_name: 'runner' };
            }
        });
        sandbox.resetHistory();
    });

    after(() => {
        sandbox.restore();
    });

    it('Docker version is provided, no need to fetch latest version', async () => {
        dockerHubConnector.__set__('configHandler', {
            getConfig: () => {
                return { docker_name: 'zooz/predator-runner:1.0.0' };
            }
        });
        let newestTag = await dockerHubConnector.getMostRecentRunnerTag();
        newestTag.should.eql('zooz/predator-runner:1.0.0');
    });

    [{ results: [{ name: '1.0.0' }, { name: '0.9.9' }, { name: '1.0.1' }, { name: 'latest' }], expected: 'runner:1.0.1' },
        { results: [{ name: '0.2.0' }, { name: '0.1.1' }, { name: '0.1.0' }, { name: 'latest' }], expected: 'runner:0.2.0' },
        { results: [{ name: '5.0.2' }, { name: '5.2.1' }, { name: 'xyz' }, { name: 'latest' }], expected: 'runner:5.2.1' },
        { results: [{ name: 'latest' }], expected: 'runner:latest' }

    ].forEach(testData => {
        it(`Should get newest tag: ${JSON.stringify(testData)}`, async () => {
            requestSenderSendStub.resolves({
                results: testData.results
            });

            let newestTag = await dockerHubConnector.getMostRecentRunnerTag();
            newestTag.should.eql(testData.expected);
            return newestTag;
        });
    });

    it('No tags exists', async () => {
        requestSenderSendStub.resolves({
            results: []
        });

        try {
            await dockerHubConnector.getMostRecentRunnerTag();
            throw new Error('Should not get here');
        } catch (error) {
            error.message.should.eql('No docker found for runner');
        }
    });

    it('On request error should throw exception', async () => {
        requestSenderSendStub.rejects(new Error('timeout'));

        try {
            await dockerHubConnector.getMostRecentRunnerTag();
            throw new Error('Should not get here');
        } catch (error) {
            error.message.should.eql('timeout');
        }
    });
});