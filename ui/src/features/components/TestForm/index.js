import React from 'react';
import TextField from 'material-ui/TextField';
import StepForm from './StepForm';
import style from './style.scss';
import * as Actions from '../../redux/action';
import * as Selectors from '../../redux/selectors/testsSelector';
import * as ProcessorsSelector from '../../redux/selectors/processorsSelector';
import {connect} from 'react-redux';
import AddButton from './addButton';
import AddScenarioForm from './addScenarioForm';
import Modal from '../Modal';
import {createTestRequest, createStateForEditTest} from './utils';
import ScenarioList from './scenarioList';
import {v4 as uuid} from 'uuid';
import {cloneDeep, reduce, isNumber} from 'lodash';
import Button from '../../../components/Button';
import ErrorDialog from '../ErrorDialog';
import ProcessorsDropDown from './ProcessorsDropDown';
import Tabs from '../../../components/Tabs/Tabs'
import TitleInput from "../../../components/TitleInput";
import TextArea from "../../../components/TextArea";
import ErrorWrapper from "../../../components/ErrorWrapper";
import StepsList from './stepsList';
import FormWrapper from "../../../components/FormWrapper";

const DESCRIPTION = 'dsfdsfdsf adjksfhk sdjfhdjksf adjksfdjksafsf sakfhdksjfhdjksfhdks sfjkdsfjds jf sjfjksd'
export class TestForm extends React.Component {
    constructor(props) {
        super(props);

        if (props.data) {
            this.state = createStateForEditTest(props.data);
        } else {
            this.state = {
                isAddScenarioOpen: false,
                isAddStepOpen: false,
                scenarios: [],
                before: null,
                isBeforeSelected: false,
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
                this.onChooseScenario(0);
            }
        } else {
            this.addScenarioHandler();

        }
    }

    render() {
        const {createTestError, processorsError, closeDialog, processorsLoading, processorsList} = this.props;
        const {name, description, baseUrl, processorId,editMode} = this.state;
        const error = createTestError || processorsError;
        return (
            <Modal onExit={closeDialog}>
                <FormWrapper title={`${editMode && 'Edit' || 'Create'} Test`} description={DESCRIPTION}>
                <div className={style['top']}>
                    <div className={style['top-inputs']}>
                        {/* left */}

                        <div className={style['input-container']}>
                            <TitleInput style={{flex: '1'}} title={'Name'}>
                                <TextArea value={name} onChange={(evt, value) => {
                                    this.setState({name: evt.target.value})
                                }}/>
                            </TitleInput>
                        </div>
                        <div className={style['input-container']}>
                            <TitleInput style={{flex: '1'}} title={'Description'}>
                                <TextArea maxRows={1} value={description} onChange={(evt, value) => {
                                    this.setState({description: evt.target.value})
                                }}/>
                            </TitleInput>
                        </div>
                        <div className={style['input-container']}>
                            <TitleInput style={{flex: '1'}} title={'Base url'}>
                                <TextArea value={baseUrl} placeholder={'http://my.api.com/'}
                                          onChange={(evt, value) => {
                                              this.setState({baseUrl: evt.target.value})
                                          }}/>
                            </TitleInput>
                        </div>

                            <div className={style['input-container']} style={{width: '376px'}}>
                                <TitleInput style={{flex: '1'}} title={'Processor'}>
                                   <ProcessorsDropDown
                                    onChange={this.onProcessorChosen} options={processorsList} value={processorId}
                                    loading={processorsLoading}/>
                                </TitleInput>

                            </div>
                        {/*{this.generateAddsButtons()}*/}
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

        return (<div style={{display: 'flex', justifyContent: 'flex-end'}}>
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
        scenarios.push({id: uuid(), steps: [], weight: maxWeight, scenario_name: 'Scenario ' + (scenarios.length + 1)});
        this.setState({
        scenarios,
        isAddStepOpen: false,
        isAddScenarioOpen: true,
        currentScenarioIndex: scenarios.length - 1,
        isBeforeSelected: false
    })
    };

    addBeforeHandler = () => {
        const before = {id: uuid(), steps: [this.initStep()]};
        this.setState({before});
        this.setState({isAddStepOpen: true, currentStepIndex: 0, currentScenarioIndex: null, isBeforeSelected: true})
    };
    addStepHandler = () => {
        const {scenarios, currentScenarioIndex, isBeforeSelected, before} = this.state;
        let steps;
        if (isBeforeSelected) {
        steps = before.steps;
    } else {
        steps = scenarios[currentScenarioIndex].steps;
    }
        steps.push(this.initStep());
        this.setState({
        scenarios,
        before,
        isAddStepOpen: true,
        isAddScenarioOpen: false,
        currentStepIndex: steps.length - 1
    })
    };

    initStep() {
        return {id: uuid(), method: 'POST', headers: [{}], captures: [{}]}
    }

    generateAddsButtons = () => {
        const {before, scenarios} = this.state;
        return (
        <div className={style['add-buttons-container']}>
        <AddButton disabled={!!before} title={'before'} onClick={this.addBeforeHandler}/>
        <AddButton title={'scenario'} onClick={this.addScenarioHandler}/>
        <AddButton disabled={scenarios.length === 0 && !before} title={'steps'} onClick={this.addStepHandler}/>
        </div>
        )
    };

    onChooseScenario = (index) => {
        this.setState({
            isAddStepOpen: false,
            isAddScenarioOpen: true,
            currentStepIndex: null,
            currentScenarioIndex: index,
            isBeforeSelected: false
        })
    };

    onChooseStep = (index) => {
        this.setState({isAddStepOpen: true, isAddScenarioOpen: false, currentStepIndex: index})
    };
    onChooseBefore = () => {
        this.setState({
            isAddStepOpen: true,
            isAddScenarioOpen: false,
            isBeforeSelected: true,
            currentStepIndex: 0,
            currentScenarioIndex: null
        })
    };
    onDeleteStep = () => {
        const {scenarios, currentStepIndex, before, isBeforeSelected} = this.state;

        let steps = this.getStepsByCurrentState();
        steps.splice(currentStepIndex, 1);
        if (isBeforeSelected && steps.length === 0) {
        this.setState({scenarios, before: undefined, currentStepIndex, isBeforeSelected: false});
    } else {
        this.setState({scenarios, before, currentStepIndex});
    }
    };
    onDuplicateStep = () => {
        const {scenarios, currentStepIndex} = this.state;
        let steps = this.getStepsByCurrentState();
        const duplicatedStep = cloneDeep(steps[currentStepIndex]);
        duplicatedStep.id = uuid();
        steps.splice(currentStepIndex, 0, duplicatedStep);
        this.setState({scenarios});
    };
    onDeleteScenario = () => {
        const {scenarios, currentScenarioIndex} = this.state;
        scenarios.splice(currentScenarioIndex, 1);
        this.setState({scenarios});
    };

    onDuplicateScenario = () => {
        const {scenarios, currentScenarioIndex} = this.state;
        const duplicatedScenario = cloneDeep(scenarios[currentScenarioIndex])
        duplicatedScenario.id = uuid();
        scenarios.splice(currentScenarioIndex, 0, duplicatedScenario);
        this.setState({scenarios});
    };

    getStepsByCurrentState = () => {
        const {scenarios, currentScenarioIndex, before, isBeforeSelected} = this.state;
        let steps;
        if (isBeforeSelected) {
        steps = before.steps
    } else {
        steps = scenarios[currentScenarioIndex].steps;
    }
        return steps;
    };

    updateStepOrder = (dragIndex, hoverIndex) => {
        const {scenarios, currentScenarioIndex, before, isBeforeSelected} = this.state;
        let steps;
        if (isBeforeSelected) {
        steps = before.steps
    } else {
        steps = scenarios[currentScenarioIndex].steps;
    }
        const step = steps[dragIndex];
        steps.splice(dragIndex, 1);
        steps.splice(hoverIndex, 0, step);

        this.setState({scenarios, before, currentStepIndex: hoverIndex});
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
        isAddStepOpen, isAddScenarioOpen, scenarios, before, currentScenarioIndex, currentStepIndex, isBeforeSelected, editMode,
        afterStepProcessorValue, beforeStepProcessorValue,
        processorsExportedFunctions
    } = this.state;
        const scenario = scenarios[currentScenarioIndex];

        let step;
        if (isBeforeSelected) {
        step = before.steps[currentStepIndex];
    } else {
        step = scenario ? scenario.steps[currentStepIndex] : undefined;
    }
        console.log('scenarios',scenarios)
        return (
        <div className={style['bottom']}>
        {/* bottom */}

        <Tabs className={style.tabs}>
        {
            scenarios.map((scenario, index) => {
                console.log('scenario', scenario)
                return (
                <Tabs.TabPane onClick={() => this.onChooseScenario(index)} lazy={false} tab={scenario.scenario_name}
                              key={scenario.id}>
                    <AddScenarioForm allowedWeight={this.calcMaxAllowedWeight()} key={currentScenarioIndex}
                                     scenario={scenario} onChangeValue={this.onChangeValueOfScenario}
                                     processorsExportedFunctions={processorsExportedFunctions}/>
                    <StepsList steps={scenario.steps}/>

                </Tabs.TabPane>
                )
            })
        }
        </Tabs>
            <div style={{position:'absolute',zIndex:10, marginLeft:'50%', marginTop:'14px', display:'flex',justifyContent:'space-between',width:'172px'}}>
                <div className={style['actions-style']} onClick={this.addScenarioHandler}>+Add Scenario</div>
                <div className={style['actions-style']} onClick={this.addStepHandler}>+Add Step</div>
            </div>

        {/*<div style={{display: 'flex', flexDirection: 'column', width: '200px'}}>*/}
        {/*    /!*<ScenarioList*!/*/}
        {/*    /!*    scenarios={scenarios}*!/*/}
        {/*    /!*    before={before}*!/*/}
        {/*    /!*    currentScenarioIndex={currentScenarioIndex}*!/*/}
        {/*    /!*    currentStepIndex={currentStepIndex}*!/*/}
        {/*    /!*    updateStepOrder={this.updateStepOrder}*!/*/}
        {/*    /!*    onChooseScenario={this.onChooseScenario}*!/*/}
        {/*    /!*    onChooseStep={this.onChooseStep}*!/*/}
        {/*    /!*    onChooseBefore={this.onChooseBefore}*!/*/}
        {/*    /!*    isBeforeSelected={isBeforeSelected}*!/*/}
        {/*    /!*    onDuplicateStep={this.onDuplicateStep}*!/*/}
        {/*    /!*    onDeleteStep={this.onDeleteStep}*!/*/}
        {/*    /!*    onDeleteScenario={this.onDeleteScenario}*!/*/}
        {/*    /!*    onDuplicateScenario={this.onDuplicateScenario}*!/*/}
        {/*/>*/}
        {/*</div>*/}
        {/*<div style={{paddingLeft: '10px', width: '100%'}}>*/}
        {/*    /!*{isAddStepOpen && step && <StepForm key={`${currentScenarioIndex}_${currentStepIndex}`} step={step}*!/*/}
        {/*    /!*                                    onChangeValue={this.onChangeValueOfStep} editMode={editMode}*!/*/}
        {/*    /!*                                    processorsExportedFunctions={processorsExportedFunctions}*!/*/}
        {/*    /!*                                    onAfterStepProcessorChange={this.onAfterStepProcessorChange}*!/*/}
        {/*    /!*                                    onBeforeStepProcessorChange={this.onBeforeStepProcessorChange}*!/*/}
        {/*    /!*                                    beforeStepProcessorValue={beforeStepProcessorValue}*!/*/}
        {/*    /!*                                    afterStepProcessorValue={afterStepProcessorValue}*!/*/}
        {/*</div>*/}

        </div>
        )
    };

    onBeforeStepProcessorChange = (value) => {
        this.setState({beforeStepProcessorValue: value})
    };

    onAfterStepProcessorChange = (value) => {
        this.setState({afterStepProcessorValue: value})
    };

    onChangeValueOfScenario = (key, value) => {
        const {scenarios, currentScenarioIndex} = this.state;
        scenarios[currentScenarioIndex][key] = value;

        this.setState({scenarios: scenarios});
    };
    onChangeValueOfStep = (newStep) => {
        const {scenarios, currentScenarioIndex, currentStepIndex, before, isBeforeSelected} = this.state;
        if (isBeforeSelected) {
        before.steps[currentStepIndex] = newStep;
    } else {
        scenarios[currentScenarioIndex].steps[currentStepIndex] = newStep;
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
