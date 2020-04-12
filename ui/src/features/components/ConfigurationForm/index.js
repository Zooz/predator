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
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons';
import Button from '../../../components/Button';
import TitleInput from '../../../components/TitleInput';
import ErrorWrapper from '../../../components/ErrorWrapper';
import Input from '../../../components/Input';
import ErrorDialog from '../../components/ErrorDialog';
import {validate} from './validator';
import Snackbar from 'material-ui/Snackbar';
import UiSwitcher from '../../../components/UiSwitcher';
import {get, set} from 'lodash';
import Dropdown from "../../../components/Dropdown/Dropdown.export";

const INPUT_TYPES = {SWITCHER: 'switcher', DROPDOWN: 'dropdown'};

class Form extends React.Component {
    constructor(props) {
        super(props);
        this.Menu = [
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
                valueType: 'float'
            },
            {
                name: 'runner_memory',
                key: 'runner_memory',
                floatingLabelText: 'Runner memory (MB)',
                info: 'Max memory to use by each deployed runner',
                valueType: 'int'
            },
            {
                name: 'minimum_wait_for_delayed_report_status_update_in_ms',
                key: 'minimum_wait_for_delayed_report_status_update_in_ms',
                floatingLabelText: 'Minimum delayed time for report update (ms)',
                info: 'The minimum of time waiting for runner to report before the test is considered as finished',
                valueType: 'int'
            },
            {
                name: 'delay_runner_ms',
                key: 'delay_runner_ms',
                floatingLabelText: 'Delay runner (ms)',
                info: 'Delay the predator runner from sending http requests (ms)',
                valueType: 'int'
            },
            {
                name: 'default_webhook_url',
                key: 'default_webhook_url',
                floatingLabelText: 'Default webhook url',
                info: 'Default webhook url to send live report statistics to'
            },
            {
                name: 'interval_cleanup_finished_containers_ms',
                key: 'interval_cleanup_finished_containers_ms',
                floatingLabelText: 'Interval for clearing finished containers (ms)',
                info: 'Interval (in ms) to search and delete finished tests containers. Value of 0 means no auto clearing enabled',
                valueType: 'int'
            },
            {
                name: 'allow_insecure_tls',
                key: 'allow_insecure_tls',
                floatingLabelText: 'Allow insecure TLS',
                info: 'If true, don\'t fail requests on unverified server certificate errors',
                type: INPUT_TYPES.SWITCHER
            },
            {
                category: 'benchmark',
                inputs: [
                    {
                        name: 'benchmark_threshold',
                        key: 'benchmark_threshold',
                        floatingLabelText: 'Threshold',
                        info: 'insert info',
                        valueType: 'int'
                    },
                    {
                        name: 'benchmark_threshold_webhook_url',
                        key: 'benchmark_threshold_webhook_url',
                        floatingLabelText: 'Threshold webhook url',
                        info: 'insert info',
                        valueType: 'int'
                    },
                ]
            },
            {
                category: 'Benchmark weights',
                inputs: [
                    {
                        name: 'percentile_ninety_five',
                        key: 'benchmark_weights.percentile_ninety_five.percentage',
                        floatingLabelText: 'Percentile ninety five ratio',
                        info: 'insert info',
                        valueType: 'int'
                    },
                    {
                        name: 'percentile_fifty',
                        key: 'benchmark_weights.percentile_fifty.percentage',
                        floatingLabelText: 'Percentile fifty ratio',
                        info: 'insert info',
                        valueType: 'int'
                    },
                    {
                        name: 'server_errors',
                        key: 'benchmark_weights.server_errors.percentage',
                        floatingLabelText: 'Server errors',
                        info: 'insert info',
                        valueType: 'int'
                    },
                    {
                        name: 'client_errors',
                        key: 'benchmark_weights.client_errors.percentage',
                        floatingLabelText: 'Client errors ratio',
                        info: 'insert info',
                        valueType: 'int'
                    },
                    {
                        name: 'rps',
                        key: 'benchmark_weights.rps.percentage',
                        floatingLabelText: 'Rps ratio',
                        info: 'insert info',
                        valueType: 'int'
                    },
                ]
            },
            {
                category: 'Smtp server',
                inputs: [
                    {
                        name: 'from',
                        key: 'smtp_server.from',
                        floatingLabelText: 'From',
                        info: 'insert info'
                    },
                    {
                        name: 'host',
                        key: 'smtp_server.host',
                        floatingLabelText: 'Host',
                        info: 'insert info',
                        valueType: 'int'
                    },
                    {
                        name: 'username',
                        key: 'smtp_server.username',
                        floatingLabelText: 'Username',
                        info: 'insert info'
                    },
                    {
                        name: 'password',
                        key: 'smtp_server.password',
                        floatingLabelText: 'Password',
                        info: 'insert info'
                    },
                    {
                        name: 'port',
                        key: 'smtp_server.port',
                        floatingLabelText: 'Port',
                        info: 'insert info',
                        valueType: 'int'
                    },
                    {
                        name: 'timeout',
                        key: 'smtp_server.timeout',
                        floatingLabelText: 'Timeout',
                        info: 'insert info',
                        valueType: 'int'
                    }
                ]
            },
            {
                category: 'Metrics',
                inputs: [
                    {
                        name: 'metrics_plugin_name',
                        key: 'metrics_plugin_name',
                        floatingLabelText: 'metrics_plugin_name',
                        info: 'insert info',
                        type: INPUT_TYPES.DROPDOWN,
                        options: ['influx', 'prometheus'],
                    },
                    {
                        name: 'push_gateway_url',
                        key: 'prometheus_metrics.push_gateway_url',
                        floatingLabelText: 'Prometheus push gateway url',
                        info: 'Url of push gateway',
                        isHidden: (state) => (state.config.metrics_plugin_name !== 'prometheus')
                    },
                    {
                        name: 'buckets_sizes',
                        key: 'prometheus_metrics.buckets_sizes',
                        floatingLabelText: 'Prometheus buckets sizes',
                        info: 'Bucket sizes to configure prometheus',
                        isHidden: (state) => (state.config.metrics_plugin_name !== 'prometheus')
                    },
                    {
                        name: 'host',
                        key: 'influx_metrics.host',
                        floatingLabelText: 'Influx host',
                        info: 'Influx db host',
                        isHidden: (state) => (state.config.metrics_plugin_name !== 'influx')

                    },
                    {
                        name: 'username',
                        key: 'influx_metrics.username',
                        floatingLabelText: 'Influx username',
                        info: 'Influx db username',
                        isHidden: (state) => (state.config.metrics_plugin_name !== 'influx')

                    },
                    {
                        name: 'password',
                        key: 'influx_metrics.password',
                        floatingLabelText: 'Influx password',
                        info: 'Influx db password',
                        isHidden: (state) => (state.config.metrics_plugin_name !== 'influx')

                    },
                    {
                        name: 'database',
                        key: 'influx_metrics.database',
                        floatingLabelText: 'Influx database',
                        info: 'Influx db name',
                        isHidden: (state) => (state.config.metrics_plugin_name !== 'influx')

                    },
                ]
            }
        ];
        this.MenuFlatten = this.Menu.flatMap(objectKey => objectKey.category ? objectKey.inputs : [objectKey])

        function setByKey(src, trg, key) {
            set(trg, key, get(src, key));
        }

        const config = this.props.config;
        const configState = this.Menu.reduce((acc, objectKey) => {
            if (objectKey.category) {
                for (let input of objectKey.inputs) {
                    setByKey(config, acc, input.key);
                }
            } else {
                setByKey(config, acc, objectKey.key);
            }
            return acc;
        }, {});
        this.state = {
            config: configState,
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

    onChangeFreeText = (key, value) => {
        const newConfig = {...this.state.config};
        set(newConfig, key, value);
        const errors = (validate(newConfig, this.MenuFlatten));
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
            this.setState({config: newConfig});
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
                {this.Menu.map((oneItem, index) => {
                    return (
                        <div key={index}>
                            {oneItem.category && <h3 style={{marginTop: '0'}}>{oneItem.category}</h3>}
                            {oneItem.category && oneItem.inputs.map(((oneItem, index) => {
                                if (oneItem.isHidden && oneItem.isHidden(this.state)) {
                                    return null;
                                }
                                return this.generateInput(oneItem, index)
                            }))}
                            {!oneItem.category && this.generateInput(oneItem)}
                        </div>
                    );
                }, this)}

                <div className={style.buttons}>
                    <Button spinner={processingAction} hover disabled={!!this.isThereErrorOnForm() || processingAction}
                            onClick={this.whenSubmit}>Save</Button>
                </div>
                {serverError &&
                <ErrorDialog closeDialog={() => {
                    clearErrorOnUpdateConfig();
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

    generateInput = (oneItem, index) => {
        const value = get(this.state.config, oneItem.key);
        const error = get(this.state.errors, oneItem.key);
        return (
            <div key={index} style={{marginBottom: '15px'}}>
                <TitleInput key={oneItem.key} title={oneItem.floatingLabelText}
                            rightComponent={this.showInfo(oneItem)}>
                    {
                        oneItem.type === INPUT_TYPES.SWITCHER && (
                            <RactangleAlignChildrenLeft>
                                <UiSwitcher
                                    onChange={(value) => this.handleChangeForCheckBox(oneItem.name, value)}
                                    disabledInp={false}
                                    activeState={value}
                                    height={12}
                                    width={22}/>
                                <div className={style['run-immediately']}>{oneItem.label}</div>
                            </RactangleAlignChildrenLeft>
                        )
                        ||

                        oneItem.type === INPUT_TYPES.DROPDOWN && (
                            <RactangleAlignChildrenLeft>
                                <Dropdown
                                    options={oneItem.options.map((option) => ({key: option, value: option}))}
                                    selectedOption={{key: value, value: value}}
                                    onChange={(selected) => {
                                        this.onChangeFreeText(oneItem.key, selected.value)
                                    }}
                                    placeholder={"Method"}
                                    height={'35px'}
                                    disabled={false}
                                    validationErrorText=''
                                    enableFilter={false}
                                />
                                <div className={style['run-immediately']}>{oneItem.label}</div>
                            </RactangleAlignChildrenLeft>
                        )


                        ||
                        <ErrorWrapper errorText={error}>
                            <Input disabled={oneItem.disabled} value={value}
                                   onChange={(evt) => this.onChangeFreeText(oneItem.key, evt.target.value)}/>
                        </ErrorWrapper>
                    }

                </TitleInput>
            </div>
        )

    };

    whenSubmit = () => {
        const keyTypes = {
            runner_memory: 'int',
            runner_cpu: 'float',
            minimum_wait_for_delayed_report_status_update_in_ms: 'int',
            delay_runner_ms: 'int',
            interval_cleanup_finished_containers_ms: 'int',
        };
        const body = {};
        const list = this.Menu.flatMap((objectKey) => {
            if (objectKey.category) {
                return objectKey.inputs;
            }
            return [objectKey];
        });
        for (let objectKey of list) {
            const valueType = objectKey.valueType;
            const value = get(this.state.config, objectKey.key);
            switch (valueType) {
                case 'int':
                    const newValue = parseInt(value);
                    set(body, objectKey.key, _.isNaN(newValue) ? undefined : newValue);
                    break;
                case 'float':
                    const newValueFloat = parseFloat(value);
                    set(body, objectKey.key, _.isNaN(newValueFloat) ? undefined : newValueFloat);

                    break;
                default:
                    set(body, objectKey.key, value);
            }
        }

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
    cleanUpdateConfigSuccess: Actions.cleanUpdateConfigSuccess
};

export default connect(mapStateToProps, mapDispatchToProps)(Form);
