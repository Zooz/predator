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
import {FileDrop} from 'react-file-drop';
import env from '../../../App/common/env';
import {CONTENT_TYPES, CAPTURE_TYPES, CAPTURE_KEY_VALUE_PLACEHOLDER} from './constants'

import {
    faDownload
} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

const SLEEP = 'sleep';


export class TestForm extends React.Component {
    constructor(props) {
        super(props);
        if (props.data) {
            this.state = createStateForEditTest(props.data, props.cloneMode);
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
                processorsExportedFunctions: [],
                csvMode: false,
                csvFile: null,
                csvFileId: undefined
            }

        }
    }

    postTest = () => {
        const {editMode, id} = this.state;
        const {createTest, editTest} = this.props;
        if (editMode) {
            editTest(createTestRequest(this.state), id, this.state.csvFile)
        } else {
            createTest(createTestRequest(this.state), this.state.csvFile);
        }
    };
    onCloseErrorDialog = () => {
        const {maxSupportedScenariosUi} = this.state;
        const {cleanAllErrors} = this.props;
        cleanAllErrors();
        if (maxSupportedScenariosUi) {
            this.setState({maxSupportedScenariosUi: null})
        }

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

    componentWillUnmount() {
        this.props.getFileMetadataSuccess(undefined);
    }

    componentDidMount() {
        this.props.getProcessors({exclude: 'javascript'});
        this.props.initForm();
        if (this.state.editMode || this.props.cloneMode) {

            if (this.props.data.csv_file_id) {
                this.props.getFileMetadata(this.props.data.csv_file_id);
            }


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
        const {createTestError, processorsError, closeDialog, processorsLoading, processorsList, csvMetadata} = this.props;
        const {name, description, baseUrl, processorId, editMode, maxSupportedScenariosUi} = this.state;
        const error = createTestError || processorsError || maxSupportedScenariosUi;
        return (
            <Modal style={{paddingTop: '12px', paddingBottom: '12px', paddingLeft: '40px', paddingRight: '40px'}}
                   height={'100%'} width={'100%'} maxWidth={'1440px'} onExit={closeDialog}>
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
    };
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
        }, () => {
            this.addStepHandler();
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
    addStepHandler = (type) => {
        const {scenarios, currentScenarioIndex, before} = this.state;

        let steps;
        if (currentScenarioIndex === null) {
            //should be before selected
            steps = before.steps;
        } else {
            steps = scenarios[currentScenarioIndex].steps;
        }
        steps.push(this.initStep(type));
        this.setState({
            scenarios,
            before,
        })
    };

    initStep(type) {
        if (type === SLEEP) {
            return {id: uuid(), sleep: 10, type};
        }
        return {
            id: uuid(),
            method: 'POST',
            headers: [{}],
            captures: [{
                type: CAPTURE_TYPES.JSON_PATH,
                keyPlaceholder: CAPTURE_KEY_VALUE_PLACEHOLDER[CAPTURE_TYPES.JSON_PATH].key,
                valuePlaceholder: CAPTURE_KEY_VALUE_PLACEHOLDER[CAPTURE_TYPES.JSON_PATH].value
            }],
            url: '',
            forever: true,
            contentType: CONTENT_TYPES.APPLICATION_JSON
        }
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
        let newCurrentScenarioIndex;
        if (currentScenarioIndex === 0) {
            newCurrentScenarioIndex = 0;
        } else {
            newCurrentScenarioIndex = currentScenarioIndex - 1;
        }
        this.setState({scenarios, currentScenarioIndex: newCurrentScenarioIndex});
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
    updateStepOrder = (dragIndex, hoverIndex) => {
        const {scenarios, currentScenarioIndex, before} = this.state;
        let steps;
        if (currentScenarioIndex === null) {
            steps = before.steps;
        } else {
            steps = scenarios[currentScenarioIndex].steps;
        }
        const step = steps[dragIndex];
        steps.splice(dragIndex, 1);
        steps.splice(hoverIndex, 0, step);
        this.setState({scenarios, before});
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
            processorsExportedFunctions, csvMode,
            csvFile,

        } = this.state;
        const {csvMetadata} = this.props;

        const currentCsvFile = csvFile ? csvFile : (csvMetadata ? {name: csvMetadata.filename} : undefined);

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
                    // width: '313px'
                }}>

                    <div className={style['actions-style']} onClick={this.addScenarioHandler}>+Add Scenario</div>
                    <div className={style['actions-style']} onClick={this.addStepHandler}>+Add Step</div>
                    <div className={style['actions-style']} onClick={() => this.addStepHandler(SLEEP)}>+Add Sleep</div>
                    <div className={style['actions-style']} onClick={this.addBeforeHandler}>+Add Before</div>
                    <div className={style['actions-style']}
                         onClick={() => this.setState({csvMode: true})}>{(csvFile || csvMetadata) ? 'Modify' : '+Add'} CSV
                    </div>
                </div>
                {csvMode &&
                <DragAndDrop csvMetadata={csvMetadata} csvFile={currentCsvFile}
                             onDropFile={(file) => this.setState({csvFile: file})}/>}
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
                                                onDeleteScenario={scenarios.length === 1 ? undefined : this.onDeleteScenario}
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
                                                   updateStepOrder={this.updateStepOrder}
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

export const DragAndDrop = ({csvFile, onDropFile, csvMetadata}) => {
    const styles = {
        border: '1px solid black', borderStyle: 'dashed', height: 50, color: 'black',
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex'
    };
    return (
        <div style={styles}>
            <FileDrop
                targetClassName={style.fileDropTarget}
                className={style.fileDrop}
                // onFrameDragEnter={(event) => console.log('onFrameDragEnter', event)}
                // onFrameDragLeave={(event) => console.log('onFrameDragLeave', event)}
                // o    nFrameDrop={(event) => console.log('onFrameDrop', event)}
                // onDragOver={(event) => console.log('onDragOver', event)}
                // onDragLeave={(event) => console.log('onDragLeave', event)}
                onDrop={(files, event) => {
                    onDropFile(files[0])
                }}
            >

                {
                    csvFile && csvFile.name
                    ||
                    <span>Drop csv file here</span>
                }

                {csvMetadata &&
                <div className={style['download-button']}
                     onClick={() => window.open(`${env.PREDATOR_URL}/files/${csvMetadata.id}`)}>
                    <FontAwesomeIcon icon={faDownload}/>
                </div>
                }

            </FileDrop>
        </div>
    );
};

function mapStateToProps(state) {
    return {
        isLoading: Selectors.isLoading(state),
        createTestError: Selectors.errorOnCreateTest(state),
        createTestSuccess: Selectors.createTestSuccess(state),
        processorsList: ProcessorsSelector.processorsList(state),
        processorsLoading: ProcessorsSelector.processorsLoading(state),
        processorsError: ProcessorsSelector.processorFailure(state),
        csvMetadata: Selectors.csvMetadata(state)
    }
}

const mapDispatchToProps = {
    createTest: Actions.createTest,
    editTest: Actions.editTest,
    cleanAllErrors: Actions.cleanAllErrors,
    getProcessors: Actions.getProcessors,
    initForm: Actions.initCreateTestForm,
    getFileMetadata: Actions.getFileMetadata,
    getFileMetadataSuccess: Actions.getFileMetadataSuccess
};
export default connect(mapStateToProps, mapDispatchToProps)(TestForm);
