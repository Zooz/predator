import React, {Fragment} from 'react';
import style from './style.scss';
import Checkbox from 'material-ui/Checkbox';
import {connect} from 'react-redux';
import {processingCreateJob, createJobSuccess, createJobFailure} from '../../instance/redux/selectors/jobsSelector';
import * as Actions from '../../instance/redux/action';
import ErrorDialog from '../ErrorDialog';
import TooltipWrapper from '../../../../components/TooltipWrapper';
import RactangleAlignChildrenLeft from '../../../../components/RectangleAlign/RectangleAlignChildrenLeft';
import {validate} from './validator';
import CronViewer from './cronViewer';
import Modal from '../Modal';
import Button from '../../../../components/Button'
import TitleInput from '../../../../components/TitleInput'
import Input from '../../../../components/Input'
import FormWrapper from "../../../../components/FormWrapper";
import ErrorWrapper from "../../../../components/ErrorWrapper";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons'
import TextArea from '../../../../components/TextArea';
import MultiValueInput from '../../../../components/MultiValueInput';
import UiSwitcher from '../../../../components/UiSwitcher';
import {filter} from 'lodash';

const DESCRIPTION='Predator executes tests through jobs. Use this form to specify the parameters for the job you want to execute.';
const inputTypes = {
    INPUT_LIST: 'INPUT_LIST',
    SWITCHER: 'SWITCHER',
    TEXT_FIELD: 'TEXT_FIELD'
};

class Form extends React.Component {
    constructor(props) {
        super(props);
        this.FormList = [
            {
                width: 350,
                name: 'test_id',
                key: 'id',
                disabled: true,
                floatingLabelText: 'Test Id',
                info: 'The test id used to find the test in the API.'
            },
            {
                width: 350,
                name: 'test_name',
                key: 'test_name',
                disabled: true,
                floatingLabelText: 'Test Name',
                info: 'The test name that you are going to run.'
            },
            {
                width: 350,
                name: 'notes',
                key: 'notes',
                floatingLabelText: 'Notes',
                element: 'notes',
                info: 'Add notes about the test.',
                type: inputTypes.TEXT_FIELD
            },
            {
                width: 350,
                name: 'arrival_rate',
                key: 'arrival_rate',
                floatingLabelText: 'Arrival rate',
                info: 'Number of scenarios per second that the test fires.'
            },
            {
                width: 350,
                name: 'duration',
                key: 'duration',
                floatingLabelText: 'Duration (Minutes)',
                info: 'The duration of the test in minutes.'
            },
            {
                width: 350,
                name: 'ramp_to',
                key: 'ramp_to',
                floatingLabelText: 'Ramp to',
                info: 'A linear ramp up phase where the number of new arrivals increases linearly over the duration of the phase. The test starts with the Arrival Rate value until reaching this value.'
            },
            {
                width: 350,
                name: 'parallelism',
                key: 'parallelism',
                floatingLabelText: 'Parallelism',
                info: 'The amount of runners predator will start, arrival rate, ramp to and max virtual users will split between them.',
                defaultValue: '1'
            },
            {
                width: 350,
                name: 'max_virtual_users',
                key: 'max_virtual_users',
                floatingLabelText: 'Max virtual users',
                info: 'Max concurrent number of users doing requests, if there is more requests that have not returned yet, requests will be dropped',
                defaultValue: '500'
            },
            {
                width: 350,
                name: 'environment',
                key: 'environment',
                floatingLabelText: 'Environment',
                info: 'The chosen environment to test. Free text used to logically separate between tests runs'
            },
            {
                width: 350,
                name: 'cron_expression',
                key: 'cron_expression',
                floatingLabelText: 'Cron expression',
                info: 'Schedule a reoccurring job using this. For example, cron expression: "0 0 22 * * *" runs the test every day at 22:00 UTC.'
            },
            {
                width: 350,
                name: 'run_immediately',
                key: 'run_immediately',
                label: 'Run immediately',
                // info: 'Schedule a one time job, which will run the test now.',
                type: inputTypes.SWITCHER
            },
            {
                width: 350,
                name: 'emails',
                key: 'emails',
                floatingLabelText: 'Emails',
                info: 'When the test finishes, a report will be sent to the emails included.',
                element: 'Email',
                type: inputTypes.INPUT_LIST
            },
            {
                width: 350,
                name: 'webhooks',
                key: 'webhooks',
                floatingLabelText: 'Webhooks',
                info: 'Send test reports to Slack.',
                element: 'Webhook',
                type: inputTypes.INPUT_LIST
            }

        ];
        this.state = {
            test_id: this.props.data ? this.props.data.id : '',
            test_name: this.props.data ? this.props.data.name : '',
            arrival_rate: undefined,
            duration: undefined,
            ramp_to: undefined,
            environment: 'test',
            cron_expression: undefined,
            run_immediately: false,
            emails: [],
            webhooks: [],
            helpInfo: undefined,
            parallelism: undefined,
            max_virtual_users: undefined,
            errors: {
                name: undefined,
                retries: undefined,
                uris: undefined,
                upstream_url: undefined,
                upstream_send_timeout: undefined,
                upstream_read_timeout: undefined,
                upstream_connect_timeout: undefined
            },
            anchorEl: null
        };
        this.state.errors = validate(this.state);
        this.FormList.forEach((item) => {
            if (item.defaultValue) {
                this.state[item.name] = item.defaultValue;
            }
        });
    }

    handleChangeForCheckBox = (name, value) => {
        const newState = Object.assign({}, this.state, {[name]: value});
        newState.errors = validate(newState);
        this.setState(newState);
    };

    componentWillUnmount() {
        this.props.clearErrorOnCreateJob();
    }

    onChangeFreeText = (name, evt) => {
        const newState = Object.assign({}, this.state, {[name]: evt.target.value});
        newState.errors = validate(newState);
        this.setState(newState);
    };

    handleInputListAdd = (target, newElement) => {
        this.setState({
            [target]: [...this.state[target], newElement]
        });
    };

    handleInputListRemove = (target, element) => {
        this.setState({
            [target]: filter(this.state[target],(cur)=>(cur!==element))
        });
    };


    isThereErrorOnForm() {
        let state = this.state;

        return (Object.values(state.errors).find((oneError) => {
            return oneError !== undefined;
        }));
    }

    showInfo(item) {
        if(!item || !item.info){
            return null;
        }
        return (<TooltipWrapper
            content={
                <div>
                    {item.info}
                </div>}
            dataId={`tooltipKey_${item.key}`}
            place='top'
            offset={{top: 1}}
        >
            <div data-tip data-for={`tooltipKey_${item.info}`} style={{cursor: 'pointer'}}>
                <FontAwesomeIcon style={{color:'#557eff',fontSize:'13px'}} icon={faQuestionCircle}/>
            </div>

        </TooltipWrapper>);
    }

    render() {
        const {closeDialog, processingAction} = this.props;
        return (
            <Modal width={'50%'} onExit={closeDialog}>
                <FormWrapper title={'Create a new job'} description={DESCRIPTION}>
                    <div style={{width:'100%'}}>
                            {this.FormList.map((oneItem, index) => {
                                return (<Fragment key={index}>
                                    {!oneItem.hidden &&
                                    <RactangleAlignChildrenLeft className={style['input-wrapper']}>
                                        <div style={{flex:'1'}}>
                                        {this.generateInput(oneItem)}
                                        </div>
                                    </RactangleAlignChildrenLeft>}
                                </Fragment>);
                            }, this)}
                            <div className={style.buttons}>
                                <Button inverted onClick={closeDialog}>Cancel</Button>
                                <Button spinner={processingAction} hover disabled={!!this.isThereErrorOnForm()}
                                        onClick={this.whenSubmit}>Submit</Button>
                            </div>
                            {this.props.serverError ? <ErrorDialog showMessage={this.props.serverError} /> : null}
                        </div>
                </FormWrapper>
            </Modal>
        );
    }

    generateInput = (oneItem) => {
        const {cron_expression} = this.state;
        switch (oneItem.type) {
            case inputTypes.SWITCHER:

                {/*<Checkbox style={{width: oneItem.width, marginTop: '10px'}} key={oneItem.key}*/}
                          {/*disabled={oneItem.disabled}*/}
                          {/*errorText={this.state.errors[oneItem.name]}*/}
                          {/*onCheck={(evt) => {*/}
                              {/*this.handleChangeForCheckBox(oneItem.name, evt)*/}
                          {/*}}*/}
                          {/*label={oneItem.label}*/}
                          {/*name={oneItem.name}*/}
                          {/*value={false}*/}
                {/*/>*/}
                return (
                    <RactangleAlignChildrenLeft>
                        <UiSwitcher
                            onChange={(value) => this.handleChangeForCheckBox(oneItem.name, value)}
                            disabledInp={false}
                            activeState={this.state[oneItem.name]}
                            height={12}
                            width={22}/>
                        <div className={style['run-immediately']}>{oneItem.label}</div>
                    </RactangleAlignChildrenLeft>





                );
            case inputTypes.INPUT_LIST:
                return (
                    <TitleInput key={oneItem.key} title={oneItem.floatingLabelText} rightComponent={this.showInfo(oneItem)}>
                        <MultiValueInput
                            values={this.state[oneItem.name].map((value) => ({value, label: value}))}
                            onAddItem={(evt) => this.handleInputListAdd(oneItem.name, evt)}
                            onRemoveItem={evt => this.handleInputListRemove(oneItem.name, evt)}
                            // validationFunc={validateFunc}
                        />
                    </TitleInput>

                );

            case inputTypes.TEXT_FIELD:
                return (
                    <TitleInput key={oneItem.key} title={oneItem.floatingLabelText} rightComponent={this.showInfo(oneItem)}>
                        <ErrorWrapper errorText={this.state.errors[oneItem.name]}>
                            <TextArea
                                disabled={oneItem.disabled}
                                onChange={(evt) => this.onChangeFreeText(oneItem.name, evt)}

                            />
                        </ErrorWrapper>
                    </TitleInput>
                );
            default:
                console.log('oneItem',oneItem)
                return (
                        <div>
                            <TitleInput key={oneItem.key} title={oneItem.floatingLabelText} rightComponent={this.showInfo(oneItem)}>
                                <ErrorWrapper errorText={this.state.errors[oneItem.name]}>
                                <Input disabled={oneItem.disabled} value={this.state[oneItem.name]} onChange={(evt) => this.onChangeFreeText(oneItem.name, evt)}/>
                                </ErrorWrapper>
                            </TitleInput>
                            {oneItem.name === 'cron_expression' && <CronViewer value={cron_expression}/>}
                        </div>

                );
        }
    }

    whenSubmit = () => {

        let body = {
            test_id: this.props.data.id,
            arrival_rate: parseInt(this.state.arrival_rate),
            duration: parseInt(this.state.duration) * 60,
            ramp_to: this.state.ramp_to ? parseInt(this.state.ramp_to) : undefined,
            environment: this.state.environment,
            run_immediately: (this.state.run_immediately === undefined) ? false : this.state.run_immediately,
            emails: this.state.emails,
            webhooks: this.state.webhooks,
            notes: this.state.notes,
            parallelism: this.state.parallelism ? parseInt(this.state.parallelism) : undefined,
            max_virtual_users: this.state.max_virtual_users ? parseInt(this.state.max_virtual_users) : undefined
        };
        if(this.state.cron_expression){//should exist and not empty
            body.cron_expression=this.state.cron_expression
        }
        body = JSON.parse(JSON.stringify(body));
        this.props.createJob(body);
    };
}

function mapStateToProps(state) {
    return {
        processingAction: processingCreateJob(state),
        serverError: createJobFailure(state),
        createJobSuccess: createJobSuccess(state)
    };
}

const mapDispatchToProps = {
    clearErrorOnCreateJob: Actions.clearErrorOnCreateJob,
    createJob: Actions.createJob,
};

export default connect(mapStateToProps, mapDispatchToProps)(Form);


