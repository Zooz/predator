import React, { Fragment } from 'react';
import _ from 'lodash';
import style from './style.scss';
import {connect} from 'react-redux';
import {processingUpdateConfig, errorOnUpdateConfig, config} from '../../redux/selectors/configSelector';
import * as Actions from '../../redux/action';
import TooltipWrapper from '../../../components/TooltipWrapper';
import RactangleAlignChildrenLeft from '../../../components/RectangleAlign/RectangleAlignChildrenLeft';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faQuestionCircle} from "@fortawesome/free-solid-svg-icons";
import Modal from "../Modal";
import FormWrapper from "../../../components/FormWrapper";
import Button from "../../../components/Button";
import TitleInput from "../../../components/TitleInput";
import ErrorWrapper from "../../../components/ErrorWrapper";
import Input from "../../../components/Input";
import history from '../../../store/history'
import Loader from '../Loader'
import {validate} from './validator';

const DESCRIPTION = 'Predator configuration';

class Form extends React.Component {
    constructor (props) {
        super(props);
        this.state = {};
        this.GeneralList = {
            title: 'General',
            data: [
                {
                    width: 350,
                    name: 'internal_address',
                    key: 'internal_address',
                    floatingLabelText: 'Internal address',
                    info: 'The local ip address of your machine'
                },
                {
                    width: 350,
                    name: 'runner_docker_image',
                    key: 'runner_docker_image',
                    floatingLabelText: 'Docker image name',
                    info: 'The predator-runner docker image that will run the test'
                },
                {
                    width: 350,
                    name: 'runner_cpu',
                    key: 'runner_cpu',
                    floatingLabelText: 'Runner CPU',
                    info: 'The CPU allocated by each deployed runner',
                },
                {
                    width: 350,
                    name: 'runner_memory',
                    key: 'runner_memory',
                    floatingLabelText: 'Runner memory (MB)',
                    info: 'Max memory to use by each deployed runner',
                },
                {
                    width: 350,
                    name: 'minimum_wait_for_delayed_report_status_update_in_ms',
                    key: 'minimum_wait_for_delayed_report_status_update_in_ms',
                    floatingLabelText: 'Minimum delayed time for report update (ms)',
                    info: 'The minimum of time waiting for runner to report before the test is considered as finished',
                },
                {
                    width: 350,
                    name: 'default_webhook_url',
                    key: 'default_webhook_url',
                    floatingLabelText: 'Default webhook url',
                    info: 'Default webhook url to send live report statistics to'
                }
            ]
        };
        this.state = {
            internal_address: undefined,
            runner_docker_image: undefined,
            runner_cpu: undefined,
            runner_memory: undefined,
            minimum_wait_for_delayed_report_status_update_in_ms: undefined,
            default_webhook_url: undefined,
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
    }

    componentDidMount () {

    }


    onChangeFreeText = (name, evt) => {
        const newState = Object.assign({}, this.state, { [name]: evt.target.value });
        newState.errors = validate(newState);
        this.setState(newState);
    };

    closeViewErrorDialog = () => {
        this.props.clearErrorOnUpdateConfig();
    };

    showValue (value, configDetails, field) {
        let configField = (configDetails ? configDetails[field] : undefined);
        return this.props.serverError ? configField : value || '';
    }

    isThereErrorOnForm () {
        let state = this.state;

        return (Object.values(state.errors).find((oneError) => {
            return oneError !== undefined;
        }));
    }

    static getDerivedStateFromProps (nextProps, prevState) {
        let newState = {};

        const config = nextProps.config || {};

        Object.keys(prevState).forEach((key) => {
            if (prevState[key] === '') {
                newState[key] = prevState[key];
            }
            else if (prevState[key] && prevState[key] !== config[key]) {
                newState[key] = prevState[key];
            } else {
                newState[key] = config[key];
            }
        });
        return newState;
    };

    showInfo(item) {
        if (!item || !item.info) {
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
                <FontAwesomeIcon style={{color: '#557eff', fontSize: '13px'}} icon={faQuestionCircle}/>
            </div>

        </TooltipWrapper>);
    }

    render() {
        const {processingAction, serverError, clearErrorOnUpdateConfig, config} = this.props;
        return (
            config
                ? <Modal width={'50%'} onExit={this.closeDialog}>
                    <FormWrapper title={'Configuration'} description={DESCRIPTION}>
                        <div style={{width: '100%'}}>
                            <h3>{this.GeneralList.title}</h3>
                            {this.GeneralList.data.map((oneItem, index) => {
                                return (
                                    <div>
                                        <Fragment key={index}>
                                            {!oneItem.hidden &&
                                            <RactangleAlignChildrenLeft className={style['input-wrapper']}>
                                                <div style={{flex: '1'}}>
                                                    {this.generateInput(oneItem)}
                                                </div>
                                            </RactangleAlignChildrenLeft>}
                                        </Fragment>
                                    </div>);
                            }, this)}

                            <div className={style.buttons}>
                                <Button inverted onClick={this.closeDialog}>Cancel</Button>
                                <Button spinner={processingAction} hover disabled={!!this.isThereErrorOnForm()}
                                        onClick={this.whenSubmit}>Submit</Button>
                            </div>
                        </div>
                    </FormWrapper>
                </Modal>
                : <Loader />
        );
    }

    closeDialog = () => {
        history.push('/last_reports');
    };

    generateInput = (oneItem) => {
        return (
            <div>
                <TitleInput key={oneItem.key} title={oneItem.floatingLabelText}
                            rightComponent={this.showInfo(oneItem)}>
                    <ErrorWrapper errorText={this.state.errors[oneItem.name]}>
                        <Input disabled={oneItem.disabled} value={this.state[oneItem.name]}
                               onChange={(evt) => this.onChangeFreeText(oneItem.name, evt)}/>
                    </ErrorWrapper>
                </TitleInput>
            </div>
        );
    };

    whenSubmit = () => {
        const keyTypes = {
            runner_memory: 'int',
            runner_cpu: 'float',
            minimum_wait_for_delayed_report_status_update_in_ms: 'int'
        };

        let body = {};

        Object.keys(this.state).forEach((configKey) => {
            if (configKey !== 'errors') {
                if (keyTypes[configKey] === 'int') {
                    body[configKey] = parseInt(this.state[configKey]);
                } else if (keyTypes[configKey] === 'float') {
                    body[configKey] = parseFloat(this.state[configKey]);
                } else {
                    body[configKey] = this.state[configKey];
                }
            }
        });

        //delete empty values from config
        for(let key in body) {
            if (!_.isNumber(body[key]) && _.isEmpty(body[key])) {
                delete body[key];
                this.props.deleteConfigKey(key);
            }
        }

        //remove undefined values
        body = JSON.parse(JSON.stringify(body));

        this.props.updateConfig(body);
        this.props.getConfig(body);
    };
}

function mapStateToProps (state) {
    return {
        config: config(state),
        processingAction: processingUpdateConfig(state),
        serverError: errorOnUpdateConfig(state)
    };
}

const mapDispatchToProps = {
    clearErrorOnUpdateConfig: Actions.clearUpdateConfigError,
    updateConfig: Actions.updateConfig,
    deleteConfigKey: Actions.deleteConfigKey,
    getConfig: Actions.getConfig
};

export default connect(mapStateToProps, mapDispatchToProps)(Form);