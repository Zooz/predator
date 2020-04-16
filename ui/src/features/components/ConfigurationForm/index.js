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
import {get, set, pickBy} from 'lodash';
import Dropdown from "../../../components/Dropdown/Dropdown.export";

const INPUT_TYPES = {SWITCHER: 'switcher', DROPDOWN: 'dropdown'};
const isMetricsDropdownHidden = (state, type) => (state.config.metrics_plugin_name ? state.config.metrics_plugin_name !== type : state.serverConfig.metrics_plugin_name !== type)

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
                category: 'Benchmark',
                inputs: [
                    {
                        name: 'benchmark_threshold',
                        key: 'benchmark_threshold',
                        floatingLabelText: 'Threshold score',
                        info: 'Minimum acceptable score of tests, if a score is less than this value, a webhook will be sent to the threshold webhook url',
                        valueType: 'int'
                    },
                    {
                        name: 'benchmark_threshold_webhook_url',
                        key: 'benchmark_threshold_webhook_url',
                        floatingLabelText: 'Threshold webhook url',
                        info: 'Url to send webhooks to incase a test receives a score less than the benchmark threshold'
                    },
                ]
            },
            {
                category: 'Benchmark weights',
                inputs: [
                    {
                        name: 'percentile_ninety_five',
                        key: 'benchmark_weights.percentile_ninety_five.percentage',
                        floatingLabelText: 'p95',
                        info: 'Percentage of the score affected by p95 results',
                        inheritFromServerKeyObject: 'benchmark_weights',
                        valueType: 'int'
                    },
                    {
                        name: 'percentile_fifty',
                        key: 'benchmark_weights.percentile_fifty.percentage',
                        floatingLabelText: 'median',
                        info: 'Percentage of the score affected by median results',
                        inheritFromServerKeyObject: 'benchmark_weights',
                        valueType: 'int'
                    },
                    {
                        name: 'server_errors_ratio',
                        key: 'benchmark_weights.server_errors_ratio.percentage',
                        floatingLabelText: 'Server errors ratio',
                        info: 'Percentage of the score affected by server errors ratio',
                        inheritFromServerKeyObject: 'benchmark_weights',
                        valueType: 'int'
                    },
                    {
                        name: 'client_errors_ratio',
                        key: 'benchmark_weights.client_errors_ratio.percentage',
                        floatingLabelText: 'Client errors ratio',
                        info: 'Percentage of the score affected by client errors ratio',
                        inheritFromServerKeyObject: 'benchmark_weights',
                        valueType: 'int'
                    },
                    {
                        name: 'rps',
                        key: 'benchmark_weights.rps.percentage',
                        floatingLabelText: 'RPS',
                        info: 'Percentage of the score affected by requests per second results',
                        inheritFromServerKeyObject: 'benchmark_weights',
                        valueType: 'int'
                    },
                ]
            },
            {
                category: 'SMTP server',
                inputs: [
                    {
                        name: 'from',
                        key: 'smtp_server.from',
                        floatingLabelText: 'From',
                        info: 'The address that is used as a FROM address when sending emails',
                        inheritFromServerKeyObject: 'smtp_server'
                    },
                    {
                        name: 'host',
                        key: 'smtp_server.host',
                        floatingLabelText: 'Host',
                        info: 'SMTP server host',
                        inheritFromServerKeyObject: 'smtp_server'

                    },
                    {
                        name: 'username',
                        key: 'smtp_server.username',
                        floatingLabelText: 'Username',
                        info: 'SMTP server username used for authentication',
                        inheritFromServerKeyObject: 'smtp_server'
                    },
                    {
                        name: 'password',
                        key: 'smtp_server.password',
                        floatingLabelText: 'Password',
                        info: 'SMTP server password used for authentication',
                        inheritFromServerKeyObject: 'smtp_server',
                        secret: true
                    },
                    {
                        name: 'port',
                        key: 'smtp_server.port',
                        floatingLabelText: 'Port',
                        info: 'SMTP server port',
                        inheritFromServerKeyObject: 'smtp_server',
                        valueType: 'int'
                    },
                    {
                        name: 'timeout',
                        key: 'smtp_server.timeout',
                        floatingLabelText: 'Timeout',
                        info: 'How many milliseconds to wait for the connection to establish to SMTP server',
                        inheritFromServerKeyObject: 'smtp_server',
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
                        floatingLabelText: 'Metrics plugin name',
                        info: 'insert info',
                        type: INPUT_TYPES.DROPDOWN,
                        options: ['influx', 'prometheus'],
                        default: 'None'
                    },
                    {
                        name: 'push_gateway_url',
                        key: 'prometheus_metrics.push_gateway_url',
                        floatingLabelText: 'Prometheus push gateway url',
                        info: 'Url of push gateway',
                        inheritFromServerKeyObject: 'prometheus_metrics',
                        isHidden: (state) => isMetricsDropdownHidden(state, 'prometheus')
                    },
                    {
                        name: 'host',
                        key: 'influx_metrics.host',
                        floatingLabelText: 'Influx host',
                        info: 'Influx db host',
                        inheritFromServerKeyObject: 'influx_metrics',
                        isHidden: (state) => isMetricsDropdownHidden(state, 'influx')

                    },
                    {
                        name: 'username',
                        key: 'influx_metrics.username',
                        floatingLabelText: 'Influx username',
                        info: 'Influx db username',
                        inheritFromServerKeyObject: 'influx_metrics',
                        isHidden: (state) => isMetricsDropdownHidden(state, 'influx')
                    },
                    {
                        name: 'password',
                        key: 'influx_metrics.password',
                        floatingLabelText: 'Influx password',
                        info: 'Influx db password',
                        inheritFromServerKeyObject: 'influx_metrics',
                        secret: true,
                        isHidden: (state) => isMetricsDropdownHidden(state, 'influx')
                    },
                    {
                        name: 'database',
                        key: 'influx_metrics.database',
                        floatingLabelText: 'Influx database',
                        info: 'Influx db name',
                        inheritFromServerKeyObject: 'influx_metrics',
                        isHidden: (state) => isMetricsDropdownHidden(state, 'influx')
                    },
                ]
            }
        ];
        this.MenuFlatten = this.Menu.flatMap(objectKey => objectKey.category ? objectKey.inputs : [objectKey]);

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
            config: {},
            serverConfig: configState,
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
        const value = get(this.state.config, oneItem.key) || get(this.state.serverConfig, oneItem.key);
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
                            <Input type={oneItem.secret ? 'password' : undefined} disabled={oneItem.disabled}
                                   value={value}
                                   onChange={(evt) => this.onChangeFreeText(oneItem.key, evt.target.value)}/>
                        </ErrorWrapper>
                    }

                </TitleInput>
            </div>
        )

    };

    whenSubmit = () => {

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
            if (value === undefined || value === '') {
                continue;
            }

            if (objectKey.inheritFromServerKeyObject && !body[objectKey.inheritFromServerKeyObject]) {
                body[objectKey.inheritFromServerKeyObject] = {...this.state.serverConfig[objectKey.inheritFromServerKeyObject]}
            }

            switch (valueType) {
                case 'int':
                    const newValue = parseInt(value);
                    if (!_.isNaN(newValue)) {
                        set(body, objectKey.key, newValue);
                    }
                    break;
                case 'float':
                    const newValueFloat = parseFloat(value);
                    if (!_.isNaN(newValueFloat)) {
                        set(body, objectKey.key, newValueFloat);
                    }
                    break;
                default:
                    set(body, objectKey.key, value);
            }
        }
        const cleanedBody = pickBy(JSON.parse(JSON.stringify(body)), (value) => {
            return !(value === null || value === undefined || (typeof value === 'object' && Object.keys(value).length === 0));

        });
        this.props.updateConfig(cleanedBody);
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
