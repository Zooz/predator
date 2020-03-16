import React from 'react';
import style from './style.scss';
import * as Actions from '../../redux/action';
import * as Selectors from '../../redux/selectors/testsSelector';
import * as ProcessorsSelector from '../../redux/selectors/processorsSelector';
import {connect} from 'react-redux';
import Modal from '../Modal';
import {createTestRequest, createStateForEditTest} from './utils';
import {v4 as uuid} from 'uuid';
import {cloneDeep, reduce, isNumber} from 'lodash';
import Button from '../../../components/Button';
import ErrorDialog from '../ErrorDialog';
import ProcessorsDropDown from './ProcessorsDropDown';
import Tabs from '../../../components/Tabs/Tabs'
import TitleInput from "../../../components/TitleInput";
import TextArea from "../../../components/TextArea";
import StepsList from './stepsList';
import FormWrapper from "../../../components/FormWrapper";
import CollapsibleScenarioConfig from './collapsibleScenarioConfig';

export class TestForm extends React.Component {
    constructor(props) {
        super(props);
        if (props.data) {
            this.state = createStateForEditTest(props.data);
        } else {
            this.state = {
                scenarios: [],
                before: null,
                type: 'basic',
                name: '',
                baseUrl: '',
                description: '',
                currentScenarioIndex: 0,
                currentStepIndex: null,
                processorId: undefined,
                processorsExportedFunctions: []
            }

        }
    }

    postTest = () => {
        const {editMode, id} = this.state;
        const {createTest, editTest} = this.props;
        if (editMode) {
            editTest(createTestRequest(this.state), id)
        } else {
            createTest(createTestRequest(this.state));
        }
    };
    onCloseErrorDialog = () => {
        const {cleanAllErrors} = this.props;
        cleanAllErrors();
    };

    componentDidUpdate(prevProps, prevState) {
        const {createTestSuccess: createTestSuccessBefore, processorsList: processorsListBefore} = prevProps;
        const {createTestSuccess, closeDialog, processorsList} = this.props;

        if (createTestSuccess === true && createTestSuccessBefore === false) {
            closeDialog();
        }
        if (processorsList && processorsList.length > 0 && this.state.processorsExportedFunctions.length === 0 && this.state.processorId) {
            const processorsExportedFunctions = this.extractExportedFunctions(processorsList, this.state.processorId);
            this.setState({processorsExportedFunctions})
        }

    }

    componentDidMount() {
        this.props.getProcessors({exclude: 'javascript'});
        this.props.initForm();
        if (this.state.editMode) {
            if (this.state.before) {
                this.onChooseBefore()
            } else if (this.state.scenarios.length > 0) {
                this.onChooseScenario(this.state.scenarios[0].id);
            }
        } else {
            this.addScenarioHandler();

        }
    }

    render() {
        const {createTestError, processorsError, closeDialog, processorsLoading, processorsList} = this.props;
        const {name, description, baseUrl, processorId, editMode} = this.state;
        const error = createTestError || processorsError;
        return (
            <Modal style={{paddingTop: '65px'}} height={'93%'} onExit={closeDialog}>
                <FormWrapper title={`${editMode && 'Edit' || 'Create'} Test`}>
                    <div className={style['top']}>
                        <div className={style['top-inputs']}>
                            {/* left */}

                            <div className={style['input-container']}>
                                <TitleInput style={{flex: '1', marginTop: '2px'}} title={'Name'}>
                                    <TextArea maxRows={5} value={name} onChange={(evt, value) => {
                                        this.setState({name: evt.target.value})
                                    }}/>
                                </TitleInput>
                            </div>
                            <div className={style['input-container']}>
                                <TitleInput style={{flex: '1', marginTop: '2px'}} title={'Description'}>
                                    <TextArea maxRows={5} value={description} onChange={(evt, value) => {
                                        this.setState({description: evt.target.value})
                                    }}/>
                                </TitleInput>
                            </div>
                            <div className={style['input-container']}>
                                <TitleInput style={{flex: '1', marginTop: '2px'}} title={'Base url'}>
                                    <TextArea maxRows={5} value={baseUrl} placeholder={'http://my.api.com/'}
                                              onChange={(evt, value) => {
                                                  this.setState({baseUrl: evt.target.value})
                                              }}/>
                                </TitleInput>
                            </div>

                            <div className={style['input-container']}>
                                <TitleInput style={{flex: '1', marginTop: '2px'}} title={'Processor'}>
                                    <ProcessorsDropDown
                                        onChange={this.onProcessorChosen} options={processorsList} value={processorId}
                                        loading={processorsLoading}/>
                                </TitleInput>

                            </div>
                        </div>
                    </div>
                    {/* bottom */}

                    {this.generateScenarioDashBoard()}
                    {this.generateBottomBar()}
                    {error && <ErrorDialog closeDialog={this.onCloseErrorDialog} showMessage={error}/>}
                </FormWrapper>
            </Modal>
        )
    }

    extractExportedFunctions = (processorsList, processorId) => {
        const chosenProcessor = processorsList.find((processor) => processor.id === processorId);
        const processorsExportedFunctions = chosenProcessor ? chosenProcessor.exported_functions.map((funcName) => ({
            id: funcName,
            name: funcName
        })) : [];
        return processorsExportedFunctions;
    };

    onProcessorChosen = (id) => {
        const processorsExportedFunctions = this.extractExportedFunctions(this.props.processorsList, id);

        this.setState({
            processorId: id, processorsExportedFunctions
        })
    }
    generateBottomBar = () => {
        const {isLoading, closeDialog} = this.props;

        return (<div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '10px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '230px'}}>
                <Button inverted onClick={closeDialog}>Cancel</Button>
                <Button spinner={isLoading} hover disabled={!this.state.name}
                        onClick={this.postTest}>Submit</Button>
            </div>
        </div>)
    }
    addScenarioHandler = () => {
        const {scenarios} = this.state;
        const maxWeight = this.calcMaxAllowedWeight(scenarios.length);
        const scenarioId = uuid();
        scenarios.push({
            id: scenarioId,
            steps: [],
            weight: maxWeight,
            scenario_name: 'Scenario ' + (scenarios.length + 1)
        });
        this.setState({
            scenarios,
            currentScenarioIndex: scenarios.length - 1,
            isBeforeSelected: false
        })
    };

    addBeforeHandler = () => {
        const before = {
            id: uuid(), scenario_name: 'Before',
            isBefore: true,
            steps: [this.initStep()]
        };
        this.setState({before});
        this.setState({currentScenarioIndex: null})
    };
    addStepHandler = () => {
        const {scenarios, currentScenarioIndex, before} = this.state;

        let steps;
        if (currentScenarioIndex === null) {
            //should be before selected
            steps = before.steps;
        } else {
            steps = scenarios[currentScenarioIndex].steps;
        }
        steps.push(this.initStep());
        this.setState({
            scenarios,
            before,
        })
    };

    initStep() {
        return {id: uuid(), method: 'POST', headers: [{}], captures: [{}], url: ''}
    }

    onChooseScenario = (key) => {
        const scenarioResult = this.state.scenarios.findIndex((scenario) => scenario.id === key);
        let currentScenarioIndex = null;
        if (scenarioResult !== -1) {
            currentScenarioIndex = scenarioResult
        }
        this.setState({
            currentStepIndex: null,
            currentScenarioIndex
        })
    };

    onChooseBefore = () => {
        this.setState({
            currentScenarioIndex: null
        })
    };
    onDeleteStep = (stepIndex) => {
        const {scenarios, before, currentScenarioIndex} = this.state;

        let steps = this.getStepsByCurrentState();
        steps.splice(stepIndex, 1);
        if (currentScenarioIndex === null && steps.length === 0) {
            this.setState({scenarios, before: undefined, currentScenarioIndex: 0});
        } else {
            this.setState({scenarios, before});
        }
    };
    onDuplicateStep = (stepIndex) => {
        const {scenarios} = this.state;
        let steps = this.getStepsByCurrentState();
        const duplicatedStep = cloneDeep(steps[stepIndex]);
        duplicatedStep.id = uuid();
        steps.splice(stepIndex, 0, duplicatedStep);
        this.setState({scenarios});
    };
    onDeleteScenario = () => {
        const {scenarios, currentScenarioIndex} = this.state;
        scenarios.splice(currentScenarioIndex, 1);
        this.setState({scenarios, currentScenarioIndex: currentScenarioIndex - 1});
    };

    onDuplicateScenario = () => {
        const {scenarios, currentScenarioIndex} = this.state;
        const duplicatedScenario = cloneDeep(scenarios[currentScenarioIndex])
        duplicatedScenario.id = uuid();
        scenarios.splice(currentScenarioIndex, 0, duplicatedScenario);
        this.setState({scenarios});
    };

    getStepsByCurrentState = () => {
        const {scenarios, currentScenarioIndex, before} = this.state;
        let steps;
        if (currentScenarioIndex !== null) {
            steps = scenarios[currentScenarioIndex].steps;
        } else {
            steps = before.steps

        }
        return steps;
    };

    calcMaxAllowedWeight = (index) => {
        const {scenarios, currentScenarioIndex} = this.state;
        const exceptIndex = index || currentScenarioIndex;
        return reduce(scenarios, (result, value, key) => {
            if (exceptIndex !== key && isNumber(value.weight)) {
                result = result - value.weight;
                return result;
            } else {
                return result;
            }
        }, 100);
    };
    generateScenarioDashBoard = () => {
        const {
            scenarios, before, currentScenarioIndex,
            processorsExportedFunctions
        } = this.state;
        let tabsData;
        if (before) {
            tabsData = [before, ...scenarios];
        } else {
            tabsData = [...scenarios];
        }

        const activeTabKey = currentScenarioIndex === null ? before.id : scenarios[currentScenarioIndex] && scenarios[currentScenarioIndex].id;
        return (
            <div className={style['bottom']}>
                {/* bottom */}
                <div style={{
                    marginLeft: 'auto',
                    marginRight: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    width: '250px'
                }}>
                    <div className={style['actions-style']} onClick={this.addScenarioHandler}>+Add Scenario</div>
                    <div className={style['actions-style']} onClick={this.addStepHandler}>+Add Step</div>
                    <div className={style['actions-style']} onClick={this.addBeforeHandler}>+Add Before</div>
                </div>
                <Tabs onTabChosen={(key) => this.onChooseScenario(key)} activeTabKey={activeTabKey}
                      className={style.tabs}>
                    {
                        tabsData.map((tabData, index) => {
                            return (
                                <Tabs.TabPane style={{
                                    padding: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    flexDirection: 'column',
                                    flex: 1
                                }} tab={tabData.scenario_name || 'Scenario'}
                                              key={tabData.id}>
                                    {
                                        !tabData.isBefore &&
                                        <div style={{width: "80%"}}>

                                            <CollapsibleScenarioConfig
                                                allowedWeight={this.calcMaxAllowedWeight()}
                                                scenario={tabData}
                                                onChangeValueOfScenario={this.onChangeValueOfScenario}
                                                processorsExportedFunctions={processorsExportedFunctions}
                                                onDeleteScenario={this.onDeleteScenario}
                                                onDuplicateScenario={this.onDuplicateScenario}
                                            />
                                        </div>

                                    }
                                    <div style={{width: "70%"}}>
                                        <StepsList steps={tabData.steps}
                                                   onChangeValueOfStep={this.onChangeValueOfStep}
                                                   processorsExportedFunctions={processorsExportedFunctions}
                                                   onDeleteStep={this.onDeleteStep}
                                                   onDuplicateStep={this.onDuplicateStep}
                                        />
                                    </div>

                                </Tabs.TabPane>
                            )
                        })
                    }
                </Tabs>
            </div>
        )
    };

    onChangeValueOfScenario = (key, value) => {
        const {scenarios, currentScenarioIndex} = this.state;
        scenarios[currentScenarioIndex][key] = value;

        this.setState({scenarios: scenarios});
    };
    onChangeValueOfStep = (newStep, index) => {
        const {scenarios, currentScenarioIndex, before} = this.state;
        if (currentScenarioIndex === null) {
            before.steps[index] = newStep;
        } else {
            scenarios[currentScenarioIndex].steps[index] = newStep;
        }
        this.setState({scenarios: scenarios, before});
    };
}

function mapStateToProps(state) {
    return {
        isLoading: Selectors.isLoading(state),
        createTestError: Selectors.errorOnCreateTest(state),
        createTestSuccess: Selectors.createTestSuccess(state),
        processorsList: ProcessorsSelector.processorsList(state),
        processorsLoading: ProcessorsSelector.processorsLoading(state),
        processorsError: ProcessorsSelector.processorFailure(state),
    }
}

const mapDispatchToProps = {
    createTest: Actions.createTest,
    editTest: Actions.editTest,
    cleanAllErrors: Actions.cleanAllErrors,
    getProcessors: Actions.getProcessors,
    initForm: Actions.initCreateTestForm
};
export default connect(mapStateToProps, mapDispatchToProps)(TestForm);
