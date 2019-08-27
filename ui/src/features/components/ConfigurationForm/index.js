import React from 'react';
import style from './style.scss';
import {connect} from 'react-redux';
import {
    processingUpdateConfig,
    errorOnUpdateConfig,
    config,
    update_config_success
} from '../../redux/selectors/configSelector';
import * as Actions from '../../redux/action';
import TooltipWrapper from '../../../components/TooltipWrapper';
import RactangleAlignChildrenLeft from '../../../components/RectangleAlign/RectangleAlignChildrenLeft';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faQuestionCircle} from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/Button";
import TitleInput from "../../../components/TitleInput";
import ErrorWrapper from "../../../components/ErrorWrapper";
import Input from "../../../components/Input";
import ErrorDialog from "../../components/ErrorDialog";
import {validate} from './validator';
import Snackbar from 'material-ui/Snackbar';
import UiSwitcher from '../../../components/UiSwitcher';

const INPUT_TYPES = {SWITCHER: 'switcher'};

class Form extends React.Component {
    constructor(props) {
        super(props);
        const config = this.props.config || {};
        this.GeneralList = {
            data: [
                {
                    name: 'internal_address',
                    key: 'internal_address',
                    floatingLabelText: 'Internal address',
                    info: 'The local ip address of your machine'
                },
                {
                    name: 'runner_docker_image',
                    key: 'runner_docker_image',
                    floatingLabelText: 'Docker image name',
                    info: 'The predator-runner docker image that will run the test'
                },
                {
                    name: 'runner_cpu',
                    key: 'runner_cpu',
                    floatingLabelText: 'Runner CPU',
                    info: 'The CPU allocated by each deployed runner',
                },
                {
                    name: 'runner_memory',
                    key: 'runner_memory',
                    floatingLabelText: 'Runner memory (MB)',
                    info: 'Max memory to use by each deployed runner',
                },
                {
                    name: 'minimum_wait_for_delayed_report_status_update_in_ms',
                    key: 'minimum_wait_for_delayed_report_status_update_in_ms',
                    floatingLabelText: 'Minimum delayed time for report update (ms)',
                    info: 'The minimum of time waiting for runner to report before the test is considered as finished',
                },
                {
                    name: 'delay_runner_ms',
                    key: 'delay_runner_ms',
                    floatingLabelText: 'delay runner ms',
                    info: 'Delay the predator runner from sending http requests (ms)',
                },
                {
                    name: 'default_webhook_url',
                    key: 'default_webhook_url',
                    floatingLabelText: 'Default webhook url',
                    info: 'Default webhook url to send live report statistics to'
                },
                {
                    name: 'allow_insecure_tls',
                    key: 'allow_insecure_tls',
                    floatingLabelText: 'Allow insecure TLS',
                    info: 'If true, don\'t fail requests on unverified server certificate errors',
                    type: INPUT_TYPES.SWITCHER
                }
            ]
        };
        this.state = {
            config: {
                internal_address: config.internal_address,
                runner_docker_image: config.runner_docker_image,
                runner_cpu: config.runner_cpu,
                runner_memory: config.runner_memory,
                minimum_wait_for_delayed_report_status_update_in_ms: config.minimum_wait_for_delayed_report_status_update_in_ms,
                default_webhook_url: config.default_webhook_url,
                delay_runner_ms: config.delay_runner_ms,
                allow_insecure_tls: config.allow_insecure_tls
            },
            errors: {
                name: undefined,
                retries: undefined,
                uris: undefined,
                upstream_url: undefined,
                upstream_send_timeout: undefined,
                upstream_read_timeout: undefined,
                upstream_connect_timeout: undefined,
                delay_runner_ms: undefined
            }
        };
    }

    componentDidMount() {
    }

    componentWillUnmount() {
        this.props.clearErrorOnUpdateConfig();
    }

    onChangeFreeText = (name, evt) => {
        const newConfig = {...this.state.config, [name]: evt.target.value};
        const errors = (validate(newConfig));
        this.setState({config: newConfig, errors});
    };

    handleChangeForCheckBox = (name, value) => {
        const newConfig = {...this.state.config, [name]: value};
        this.setState({config: newConfig});
    };


    closeViewErrorDialog = () => {
        this.props.clearErrorOnUpdateConfig();
    };

    isThereErrorOnForm() {
        const state = this.state;
        return (Object.values(state.errors).find((oneError) => {
            return oneError !== undefined;
        }));
    }

    componentDidUpdate(prevProps) {

        if (prevProps.config !== this.props.config) {
            const newConfig = {};
            Object.keys(this.state.config).forEach((key) => {
                if (config[key] || _.isNumber(config[key]) || _.isBoolean(config[key])) {
                    newConfig[key] = this.props.config[key];
                }
            });
            this.setState({config: newConfig})
        }
    }

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
        const {processingAction, serverError, clearErrorOnUpdateConfig, updateSuccess} = this.props;
        return (
            <div style={{width: '100%'}}>
                    {this.GeneralList.data.map((oneItem, index) => {
                        return (
                            <div key={index}>
                                {!oneItem.hidden &&
                                <RactangleAlignChildrenLeft className={style['input-wrapper']}>
                                    <div style={{flex: '1'}}>
                                        {this.generateInput(oneItem)}
                                    </div>
                                </RactangleAlignChildrenLeft>}
                            </div>);
                    }, this)}

                <div className={style.buttons}>
                    <Button spinner={processingAction} hover disabled={!!this.isThereErrorOnForm() || processingAction}
                            onClick={this.whenSubmit}>Save</Button>
                </div>
                {serverError &&
                <ErrorDialog closeDialog={() => {
                    clearErrorOnUpdateConfig()
                }} showMessage={serverError}/>
                }
                {updateSuccess && <Snackbar
                    open={updateSuccess}
                    bodyStyle={{backgroundColor: '#2fbb67'}}
                    message={'Configuration updated successfully'}
                    autoHideDuration={4000}
                    onRequestClose={this.handleSnackbarClose}
                />}
            </div>
        );
    }

    handleSnackbarClose = () => {
        this.props.cleanUpdateConfigSuccess();
    };

    generateInput = (oneItem) => {
        if (oneItem.type === INPUT_TYPES.SWITCHER) {
            return (
                <TitleInput style={{flex: '1'}} key={oneItem.key} title={oneItem.floatingLabelText}
                            rightComponent={this.showInfo(oneItem)}>
                    <RactangleAlignChildrenLeft>
                        <UiSwitcher
                            onChange={(value) => this.handleChangeForCheckBox(oneItem.name, value)}
                            disabledInp={false}
                            activeState={this.state.config[oneItem.name]}
                            height={12}
                            width={22}/>
                        <div className={style['run-immediately']}>{oneItem.label}</div>
                    </RactangleAlignChildrenLeft>
                </TitleInput>
            )
        }
        return (
            <div>
                <TitleInput key={oneItem.key} title={oneItem.floatingLabelText}
                            rightComponent={this.showInfo(oneItem)}>
                    <ErrorWrapper errorText={this.state.errors[oneItem.name]}>
                        <Input disabled={oneItem.disabled} value={this.state.config[oneItem.name]}
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
            minimum_wait_for_delayed_report_status_update_in_ms: 'int',
            delay_runner_ms: 'int'
        };
        const body = {};
        Object.keys(this.state.config).forEach((configKey) => {
            if (keyTypes[configKey] === 'int') {
                const value = parseInt(this.state.config[configKey]);
                body[configKey] = _.isNaN(value) ? undefined : value;
            } else if (keyTypes[configKey] === 'float') {
                const value = parseFloat(this.state.config[configKey]);
                body[configKey] = _.isNaN(value) ? undefined : value;
            } else {
                body[configKey] = this.state.config[configKey];
            }
        });
        this.props.updateConfig(body);
    };
}

function mapStateToProps(state) {
    return {
        config: config(state),
        processingAction: processingUpdateConfig(state),
        serverError: errorOnUpdateConfig(state),
        updateSuccess: update_config_success(state)
    };
}

const mapDispatchToProps = {
    clearErrorOnUpdateConfig: Actions.clearUpdateConfigError,
    updateConfig: Actions.updateConfig,
    deleteConfigKey: Actions.deleteConfigKey,
    cleanUpdateConfigSuccess: Actions.cleanUpdateConfigSuccess,
};

export default connect(mapStateToProps, mapDispatchToProps)(Form);
