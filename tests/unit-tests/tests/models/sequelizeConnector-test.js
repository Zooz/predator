
const should = require('should'),
    sinon = require('sinon'),
    rewire = require('rewire'),
    sequelizeConnector = rewire('../../../../src/tests/models/database/sequelize/sequelizeConnector'),
    uuid = require('uuid');

describe('Testing sequelize connector', function () {
    let sandbox, sequelizeStub,
        syncStub,
        createStub,
        clock,
        destroyStub,
        findAllStub,
        updateStub,
        authenticateStub;
    before(async function () {
        sandbox = sinon.sandbox.create();
        syncStub = sandbox.stub();
        createStub = sandbox.stub();
        findAllStub = sandbox.stub();
        updateStub = sandbox.stub();
        authenticateStub = sandbox.stub();
        destroyStub = sandbox.stub();
        sequelizeStub = {
            authenticate: authenticateStub,
            model: sandbox.stub().returns({ create: createStub,
                findAll: findAllStub,
                destroy: destroyStub,
                update: updateStub
            }),
            define: sandbox.stub().returns({ sync: syncStub })
        };
        sequelizeStub.DataTypes = { UUID: 'uuid', STRING: 'string', DATE: 'date', TEXT: () => ('long') };
        sequelizeConnector.__set__('Sequelize', sequelizeStub);
        await sequelizeConnector.init(sequelizeStub);
        clock = sinon.useFakeTimers(123456789);
        sandbox.stub(uuid, 'v4').returns('uuid');
    });
    beforeEach(function () {
        createStub.resolves();
        authenticateStub.resolves();
        sandbox.resetHistory();
    });
    after(function () {
        sandbox.restore();
        clock.restore();
    });

    describe('insertTest', function () {
        it('when succeed insert test', async function () {
            await sequelizeConnector.insertTest({ name: 'name', description: 'desc', type: 'type', scenarios: { s: '1' } }, { name: 'name', description: 'desc', type: 'type', scenarios: { s: '1' } }, 'id', 'revisionId');
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['test']]);
            should(createStub.args).eql([
                [
                    {
                        'artillery_json': '{"name":"name","description":"desc","type":"type","scenarios":{"s":"1"}}',
                        'name': 'name',
                        'description': 'desc',
                        'raw_data': '{"s":"1"}',
                        'revision_id': 'revisionId',
                        'test_id': 'id',
                        'type': 'type',
                        'updated_at': 123456789
                    }
                ]
            ]);
        });
        it('when fail to insert test - should throw an error', async function () {
            const error = new Error('error');
            createStub.rejects(error);
            try {
                await sequelizeConnector.insertTest({ name: 'name', type: 'type', scenarios: { s: '1' } }, { name: 'name', type: 'type', scenarios: { s: '1' } }, 'id', 'revisionId');
                throw new Error('should not get here');
            } catch (err){
                should(err).eql(error);
            }
        });
    });
    describe('getTest', function () {
        it('when succeed getTest', async function () {
            findAllStub.returns([
                { dataValues: { artillery_json: JSON.stringify({ art: '1' }), raw_data: JSON.stringify({ raw: '1' }), test_id: 'test_id1' } },
                { dataValues: { artillery_json: JSON.stringify({ art: '2' }), raw_data: JSON.stringify({ raw: '1' }), test_id: 'test_id2' } }
            ]);
            const result = await sequelizeConnector.getTest('id');
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['test']]);
            should(findAllStub.args).eql([
                [
                    {
                        'order': [
                            [
                                'updated_at',
                                'DESC'
                            ],
                            [
                                'id',
                                'DESC'
                            ]
                        ],
                        'where': {
                            'test_id': 'id'
                        }
                    }
                ]
            ]);
            should(result).eql({
                'artillery_json': {
                    'art': '1'
                },
                'id': 'test_id1',
                'raw_data': {
                    'raw': '1'
                }
            });
        });
        it('when getTest not found - should return undefined', async function () {
            findAllStub.returns([]);
            const result = await sequelizeConnector.getTest('id');
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['test']]);
            should(findAllStub.args).eql([
                [
                    {
                        'order': [
                            [
                                'updated_at',
                                'DESC'
                            ],
                            [
                                'id',
                                'DESC'
                            ]
                        ],
                        'where': {
                            'test_id': 'id'
                        }
                    }
                ]
            ]);
            should(result).eql(undefined);
        });
        it('when fail to getTest - should throw an error', async function () {
            const error = new Error('test');
            findAllStub.rejects(error);
            try {
                await sequelizeConnector.getTest('id');
                throw new Error('should not get here');
            } catch (err){
                const client = sequelizeConnector.__get__('client');
                should(client.model.args).eql([['test']]);
                should(findAllStub.args).eql([
                    [
                        {
                            'order': [
                                [
                                    'updated_at',
                                    'DESC'
                                ],
                                [
                                    'id',
                                    'DESC'
                                ]
                            ],
                            'where': {
                                'test_id': 'id'
                            }
                        }
                    ]
                ]);
                should(err).eql(error);
            }
        });
    });
    describe('get all test revisions', function () {
        it('when succeed get all revisions', async function () {
            findAllStub.returns([
                { dataValues: { artillery_json: JSON.stringify({ art: '1' }), raw_data: JSON.stringify({ raw: '1' }), test_id: 'test_id1' } },
                { dataValues: { artillery_json: JSON.stringify({ art: '2' }), raw_data: JSON.stringify({ raw: '2' }), test_id: 'test_id1' } }
            ]);
            const result = await sequelizeConnector.getAllTestRevisions('id');
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['test']]);
            should(findAllStub.args).eql([
                [
                    {
                        'order': [
                            [
                                'updated_at',
                                'ASC'
                            ],
                            [
                                'id',
                                'ASC'
                            ]
                        ],
                        'where': {
                            'test_id': 'id'
                        }
                    }
                ]
            ]);
            should(result).eql([
                {
                    'artillery_json': {
                        'art': '1'
                    },
                    'id': 'test_id1',
                    'raw_data': {
                        'raw': '1'
                    }
                },
                {
                    'artillery_json': {
                        'art': '2'
                    },
                    'id': 'test_id1',
                    'raw_data': {
                        'raw': '2'
                    }
                }
            ]);
        });
        it('when getAllTestRevisions not found - should return empty array', async function () {
            findAllStub.returns([]);
            const result = await sequelizeConnector.getAllTestRevisions('id');
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['test']]);
            should(findAllStub.args).eql([
                [
                    {
                        'order': [
                            [
                                'updated_at',
                                'ASC'
                            ],
                            [
                                'id',
                                'ASC'
                            ]
                        ],
                        'where': {
                            'test_id': 'id'
                        }
                    }
                ]
            ]);
            should(result).eql([]);
        });
        it('when fail to getAllTestRevisions - should throw an error', async function () {
            const error = new Error('test');
            findAllStub.rejects(error);
            try {
                await sequelizeConnector.getAllTestRevisions('id');
                throw new Error('should not get here');
            } catch (err){
                const client = sequelizeConnector.__get__('client');
                should(client.model.args).eql([['test']]);
                should(findAllStub.args).eql([
                    [
                        {
                            'order': [
                                [
                                    'updated_at',
                                    'ASC'
                                ],
                                [
                                    'id',
                                    'ASC'
                                ]
                            ],
                            'where': {
                                'test_id': 'id'
                            }
                        }
                    ]
                ]);
                should(err).eql(error);
            }
        });
    });
    describe('getTests', function () {
        it('when succeed getTests', async function () {
            findAllStub.returns([
                { dataValues: { artillery_json: JSON.stringify({ art: '1' }), raw_data: JSON.stringify({ raw: '1' }), test_id: 'test_id1' } },
                { dataValues: { artillery_json: JSON.stringify({ art: '2' }), raw_data: JSON.stringify({ raw: '2' }), test_id: 'test_id2' } }
            ]);
            const result = await sequelizeConnector.getTests();
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['test']]);
            should(findAllStub.args).eql([
                [
                    {
                        'order': [
                            [
                                'updated_at',
                                'DESC'
                            ],
                            [
                                'id',
                                'DESC'
                            ]
                        ]
                    }
                ]
            ]);
            should(result).eql([
                {
                    'artillery_json': {
                        'art': '1'
                    },
                    'id': 'test_id1',
                    'raw_data': {
                        'raw': '1'
                    }
                },
                {
                    'artillery_json': {
                        'art': '2'
                    },
                    'id': 'test_id2',
                    'raw_data': {
                        'raw': '2'
                    }
                }
            ]);
        });
        it('when getTests not found - should return empty array', async function () {
            findAllStub.returns([]);
            const result = await sequelizeConnector.getTests();
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['test']]);
            should(findAllStub.args).eql([
                [
                    {
                        'order': [
                            [
                                'updated_at',
                                'DESC'
                            ],
                            [
                                'id',
                                'DESC'
                            ]
                        ]
                    }
                ]
            ]);
            should(result).eql([]);
        });
        it('when fail to getTest - should throw an error', async function () {
            const error = new Error('test');
            findAllStub.rejects(error);
            try {
                const result = await sequelizeConnector.getTests();
                throw new Error('should not get here');
            } catch (err){
                const client = sequelizeConnector.__get__('client');
                should(client.model.args).eql([['test']]);
                should(findAllStub.args).eql([
                    [
                        {
                            'order': [
                                [
                                    'updated_at',
                                    'DESC'
                                ],
                                [
                                    'id',
                                    'DESC'
                                ]
                            ]
                        }
                    ]
                ]);
                should(err).eql(error);
            }
        });
    });
    describe('deleteTest', function () {
        it('when succeed deleteTest', async function () {
            destroyStub.returns(1);
            const result = await sequelizeConnector.deleteTest('id');
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['test']]);
            should(destroyStub.args).eql([
                [
                    {
                        'where': {
                            'test_id': 'id'
                        }
                    }
                ]
            ]);
            should(result).eql(1);
        });
        it('when fail to deleteTest - should throw an error', async function () {
            const error = new Error('test');
            destroyStub.rejects(error);
            try {
                await sequelizeConnector.deleteTest('id');
                throw new Error('should not get here');
            } catch (err){
                const client = sequelizeConnector.__get__('client');
                should(client.model.args).eql([['test']]);
                should(destroyStub.args).eql([
                    [
                        {
                            'where': {
                                'test_id': 'id'
                            }
                        }
                    ]
                ]);
                should(err).eql(error);
            }
        });
    });
    describe('insertDslDefinition', function () {
        it('when succeed insertDslDefinition', async function () {
            const result = await sequelizeConnector.insertDslDefinition('dslName', 'definitionName', { data: 'data' });
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['dsl_definition']]);
            should(createStub.args).eql([
                [
                    {
                        'artillery_json': '{"data":"data"}',
                        'definition_name': 'definitionName',
                        'dsl_name': 'dslName',
                        'id': 'uuid'
                    }
                ]
            ]);
            should(result).eql(true);
        });
        it('when failed insertDslDefinition by id conflict validation', async function () {
            createStub.rejects(new Error('Validation error'));
            const result = await sequelizeConnector.insertDslDefinition('dslName', 'definitionName', { data: 'data' });
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['dsl_definition']]);
            should(createStub.args).eql([
                [
                    {
                        'artillery_json': '{"data":"data"}',
                        'definition_name': 'definitionName',
                        'dsl_name': 'dslName',
                        'id': 'uuid'
                    }
                ]
            ]);
            should(result).eql(false);
        });
        it('when fail to insertDslDefinition - should throw an error', async function () {
            const error = new Error('test');
            createStub.rejects(error);
            try {
                await sequelizeConnector.insertDslDefinition('dslName', 'definitionName', { data: 'data' });
                throw new Error('should not get here');
            } catch (err){
                const client = sequelizeConnector.__get__('client');
                should(client.model.args).eql([['dsl_definition']]);
                should(createStub.args).eql([
                    [
                        {
                            'artillery_json': '{"data":"data"}',
                            'definition_name': 'definitionName',
                            'dsl_name': 'dslName',
                            'id': 'uuid'
                        }
                    ]
                ]);
                should(err).eql(error);
            }
        });
    });
    describe('getDslDefinition', function () {
        it('when succeed getDslDefinition', async function () {
            findAllStub.returns([{ dataValues: { artillery_json: JSON.stringify({ data: 'data1' }) } }, { dataValues: { artillery_json: JSON.stringify({ data: 'data2' }) } }]);
            const result = await sequelizeConnector.getDslDefinition('dslName', 'definitionName');
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['dsl_definition']]);
            should(findAllStub.args).eql([
                [
                    {
                        'where': {
                            'definition_name': 'definitionName',
                            'dsl_name': 'dslName'
                        }
                    }
                ]
            ]);
            should(result).eql({ artillery_json: { data: 'data1' } });
        });
        it('when get getDslDefinition empty - should return undefined', async function () {
            findAllStub.returns([]);
            const result = await sequelizeConnector.getDslDefinition('dslName', 'definitionName');
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['dsl_definition']]);
            should(findAllStub.args).eql([
                [
                    {
                        'where': {
                            'definition_name': 'definitionName',
                            'dsl_name': 'dslName'
                        }
                    }
                ]
            ]);
            should(result).eql(undefined);
        });
        it('when fail to getDslDefinition - should throw an error', async function () {
            const error = new Error('test');
            findAllStub.rejects(error);
            try {
                await sequelizeConnector.getDslDefinition('dslName', 'definitionName');
                throw new Error('should not get here');
            } catch (err){
                const client = sequelizeConnector.__get__('client');
                should(client.model.args).eql([['dsl_definition']]);
                should(findAllStub.args).eql([
                    [
                        {
                            'where': {
                                'definition_name': 'definitionName',
                                'dsl_name': 'dslName'
                            }
                        }
                    ]
                ]);
                should(err).eql(error);
            }
        });
    });
    describe('getDslDefinitions', function () {
        it('when succeed getDslDefinitions', async function () {
            findAllStub.returns([{ dataValues: { artillery_json: JSON.stringify({ data: 'data1' }) } }, { dataValues: { artillery_json: JSON.stringify({ data: 'data2' }) } }]);
            const result = await sequelizeConnector.getDslDefinitions('dslName');
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['dsl_definition']]);
            should(findAllStub.args).eql([
                [
                    {
                        'where': {
                            'dsl_name': 'dslName'
                        }
                    }
                ]
            ]);
            should(result).eql([
                {
                    'artillery_json': {
                        'data': 'data1'
                    }
                },
                {
                    'artillery_json': {
                        'data': 'data2'
                    }
                }
            ]);
        });
        it('when get getDslDefinitions empty - should return empty array', async function () {
            findAllStub.returns([]);
            const result = await sequelizeConnector.getDslDefinitions('dslName');
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['dsl_definition']]);
            should(findAllStub.args).eql([
                [
                    {
                        'where': {
                            'dsl_name': 'dslName'
                        }
                    }
                ]
            ]);
            should(result).eql([]);
        });
        it('when fail to getDslDefinitions - should throw an error', async function () {
            const error = new Error('test');
            findAllStub.rejects(error);
            try {
                await sequelizeConnector.getDslDefinitions('dslName');
                throw new Error('should not get here');
            } catch (err){
                const client = sequelizeConnector.__get__('client');
                should(client.model.args).eql([['dsl_definition']]);
                should(findAllStub.args).eql([
                    [
                        {
                            'where': {
                                'dsl_name': 'dslName'
                            }
                        }
                    ]
                ]);
                should(err).eql(error);
            }
        });
    });
    describe('updateDslDefinition', function () {
        it('when succeed updateDslDefinition - return true on applied', async function () {
            updateStub.returns([1]);
            const result = await sequelizeConnector.updateDslDefinition('dslName', 'definitionName', { data: 'data' });
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['dsl_definition']]);
            should(updateStub.args).eql([
                [
                    {
                        'artillery_json': '{"data":"data"}',
                        'definition_name': 'definitionName',
                        'dsl_name': 'dslName'
                    },
                    {
                        'where': {
                            'definition_name': 'definitionName',
                            'dsl_name': 'dslName'
                        }
                    }
                ]
            ]);
            should(result).eql(true);
        });
        it('when succeed updateDslDefinition - return false when update does not applied', async function () {
            updateStub.returns([0]);
            const result = await sequelizeConnector.updateDslDefinition('dslName', 'definitionName', { data: 'data' });
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['dsl_definition']]);
            should(updateStub.args).eql([
                [
                    {
                        'artillery_json': '{"data":"data"}',
                        'definition_name': 'definitionName',
                        'dsl_name': 'dslName'
                    },
                    {
                        'where': {
                            'definition_name': 'definitionName',
                            'dsl_name': 'dslName'
                        }
                    }
                ]
            ]);
            should(result).eql(false);
        });
        it('when fail to updateDslDefinition - should throw an error', async function () {
            const error = new Error('test');
            updateStub.rejects(error);
            try {
                await sequelizeConnector.updateDslDefinition('dslName', 'definitionName', { data: 'data' });
                throw new Error('should not get here');
            } catch (err){
                const client = sequelizeConnector.__get__('client');
                should(client.model.args).eql([['dsl_definition']]);
                should(updateStub.args).eql([
                    [
                        {
                            'artillery_json': '{"data":"data"}',
                            'definition_name': 'definitionName',
                            'dsl_name': 'dslName'
                        },
                        {
                            'where': {
                                'definition_name': 'definitionName',
                                'dsl_name': 'dslName'
                            }
                        }
                    ]
                ]);
                should(err).eql(error);
            }
        });
    });
    describe('deleteDefinition', function () {
        it('when succeed deleteDefinition - return true on applied', async function () {
            destroyStub.returns(1);
            const result = await sequelizeConnector.deleteDefinition('dslName', 'definitionName');
            const client = sequelizeConnector.__get__('client');
            should(client.model.args).eql([['dsl_definition']]);
            should(destroyStub.args).eql([
                [
                    {
                        'where': {
                            'definition_name': 'definitionName',
                            'dsl_name': 'dslName'
                        }
                    }
                ]
            ]);
            should(result).eql(1);
        });
        it('when fail to deleteDefinition - should throw an error', async function () {
            const error = new Error('test');
            destroyStub.rejects(error);
            try {
                await sequelizeConnector.deleteDefinition('dslName', 'definitionName');
                throw new Error('should not get here');
            } catch (err){
                const client = sequelizeConnector.__get__('client');
                should(client.model.args).eql([['dsl_definition']]);
                should(destroyStub.args).eql([
                    [
                        {
                            'where': {
                                'definition_name': 'definitionName',
                                'dsl_name': 'dslName'
                            }
                        }
                    ]
                ]);
                should(err).eql(error);
            }
        });
    });
});

const defineExpectation = [
    [
        'test',
        {
            'artillery_json': {
                'type': 'long'
            },
            'description': {
                'type': 'string'
            },
            'name': {
                'type': 'string'
            },
            'raw_data': {
                'type': 'long'
            },
            'revision_id': {
                'type': 'uuid',
                'unique': 'compositeIndex'
            },
            'test_id': {
                'type': 'uuid',
                'unique': 'compositeIndex'
            },
            'type': {
                'type': 'string'
            },
            'updated_at': {
                'type': 'date'
            }
        }
    ],
    [
        'dsl_definition',
        {
            'artillery_json': {
                'type': 'long'
            },
            'definition_name': {
                'type': 'string',
                'unique': 'compositeIndex'
            },
            'dsl_name': {
                'type': 'string',
                'unique': 'compositeIndex'
            },
            'id': {
                'primaryKey': true,
                'type': 'uuid'
            }
        }
    ]
];