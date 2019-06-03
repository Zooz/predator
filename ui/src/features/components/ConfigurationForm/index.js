import React, { Fragment } from 'react';
import _ from 'lodash';
import style from './style.scss';
import {connect} from 'react-redux';
import {processingUpdateConfig, errorOnUpdateConfig, config} from '../../redux/selectors/configSelector';
import * as Actions from '../../redux/action';
import ErrorDialog from '../ErrorDialog';
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
import UiSwitcher from "../../../components/UiSwitcher";
import DropDownMenu from "material-ui/DropDownMenu";
import MenuItem from "material-ui/MenuItem";

const DESCRIPTION = 'Predator configuration';

const MetricTypes = (props) => {
    const metricTypes = ['prometheus', 'influx'];
    const { onChange, value } = props;
    return (<DropDownMenu
        autoWidth={false}
        style={{ width: '250px', marginLeft: '-25px', height: '50px' }}
        value={value}
        onChange={(event, keyNumber, value) => { onChange(value) }}
    >
        {
            metricTypes.map((type, index) => {
                return (<MenuItem key={index} value={type} primaryText={type} />
                )
            })
        }
    </DropDownMenu>);
};


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
                    info: 'The predator-runner docker image that will run the test',
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
                    floatingLabelText: 'Minimum delayed time for report update',
                    info: 'The minimum of time waiting for runner to report before the test considered as finished in milliseconds',
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
        this.MetricsList = {
            title: 'Metrics',
            data: {
                prometheus: [
                    {
                        width: 350,
                        name: 'push_gateway_url',
                        key: 'push_gateway_url',
                        floatingLabelText: 'Push gateway URL',
                        info: 'Prometheus push gateway URL'
                    },
                    {
                        width: 350,
                        name: 'bucket_sizes',
                        key: 'bucket_sizes',
                        floatingLabelText: 'Bucket sizes',
                        info: 'Bucket sizes to configure prometheus'
                    }
                ],
                influx: [
                    {
                        width: 350,
                        name: 'influx_host',
                        key: 'influx_host',
                        floatingLabelText: 'Influx database host',
                        info: 'Influx database host'
                    },
                    {
                        width: 350,
                        name: 'influx_username',
                        key: 'influx_username',
                        floatingLabelText: 'Influx database username',
                        info: 'Influx database username'
                    },
                    {
                        width: 350,
                        name: 'influx_password',
                        key: 'influx_password',
                        floatingLabelText: 'Influx database password',
                        info: 'Influx database password'
                    },
                    {
                        width: 350,
                        name: 'influx_database',
                        key: 'influx_database',
                        floatingLabelText: 'Influx database name',
                        info: 'Influx database name'
                    }
                ]
            }
        };
        this.SMTPList = {
            title: 'SMTP Server',
            data: [
                {
                    width: 350,
                    name: 'smtp_host',
                    key: 'smtp_host',
                    floatingLabelText: 'Host',
                    info: 'SMTP Server host'
                },
                {
                    width: 350,
                    name: 'smtp_port',
                    key: 'smtp_port',
                    floatingLabelText: 'Port',
                    info: 'SMTP Server port'
                },
                {
                    width: 350,
                    name: 'smtp_username',
                    key: 'smtp_username',
                    floatingLabelText: 'Username',
                    info: 'SMTP Server username'
                },
                {
                    width: 350,
                    name: 'smtp_password',
                    key: 'smtp_password',
                    floatingLabelText: 'Password',
                    info: 'SMTP Server password'
                },
                {
                    width: 350,
                    name: 'smtp_from',
                    key: 'smtp_from',
                    floatingLabelText: 'From',
                    info: 'the from email address that will be used to send emails'
                },
                {
                    width: 350,
                    name: 'smtp_timeout',
                    key: 'smtp_timeout',
                    floatingLabelText: 'Timeout',
                    info: 'Timeout to SMTP server in milliseconds'
                }
            ]
        };

        console.log(this.props.config)

        this.state = {
            add_metrics: this.props.config ? this.props.config.influx_metrics !== undefined || this.props.config.prometheus_metrics !== undefined : false,
            add_smtp_server: this.props.config && this.props.config.smtp_server ? this.props.config.smtp_server.host !== undefined : false,
            internal_address: undefined,
            runner_docker_image: undefined,
            runner_cpu: undefined,
            runner_memory: undefined,
            minimum_wait_for_delayed_report_status_update_in_ms: undefined,
            default_webhook_url: undefined,
            smtp_host: undefined,
            smtp_port: undefined,
            smtp_username: undefined,
            smtp_password: undefined,
            smtp_from: undefined,
            smtp_timeout: undefined,
            metrics_plugin_name: undefined,
            influx_host: undefined,
            influx_username: undefined,
            influx_password: undefined,
            influx_database: undefined,
            push_gateway_url: undefined,
            buckets_sizes: undefined,
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
        this.loadPageData();
    }

    loadPageData = () => {
        this.props.getConfig();
    };


    onChangeFreeText = (name, evt) => {
        const newState = Object.assign({}, this.state, { [name]: evt.target.value });
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

    handleChangeForCheckBox = (name, value) => {
        const newState = Object.assign({}, this.state, {[name]: value});
        // newState.errors = validate(newState);
        this.setState(newState);
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
                                return (<Fragment key={index}>
                                    {!oneItem.hidden &&
                                    <RactangleAlignChildrenLeft className={style['input-wrapper']}>
                                        <div style={{flex: '1'}}>
                                            {this.generateInput(oneItem)}
                                        </div>
                                    </RactangleAlignChildrenLeft>}
                                </Fragment>);
                            }, this)}

                            <h3>{this.MetricsList.title}</h3>
                            <RactangleAlignChildrenLeft>
                                <UiSwitcher
                                    onChange={(value) => this.handleChangeForCheckBox('add_metrics', value)}
                                    disabledInp={false}
                                    activeState={this.state.add_metrics}
                                    height={12}
                                    width={22}/>
                            </RactangleAlignChildrenLeft>

                            {this.state.add_metrics
                                ? <RactangleAlignChildrenLeft>
                                    <div style={{fontSize:'13px',color:'#557eff', fontWeight: 500, display: 'block'}}>
                                        Metrics plugin name
                                        <div>
                                            <MetricTypes
                                                value={this.state.metrics_plugin_name}
                                                onChange={(value) => {
                                                    this.setState({metrics_plugin_name: value});
                                                }}
                                            />
                                        </div>
                                    </div>
                                </RactangleAlignChildrenLeft>
                                : ''}

                            {this.state.add_metrics && this.state.metrics_plugin_name === 'prometheus' ? this.MetricsList.data.prometheus.map((oneItem, index) => {
                                return (<Fragment key={index}>
                                    {!oneItem.hidden &&
                                    <RactangleAlignChildrenLeft className={style['input-wrapper']}>
                                        <div style={{flex: '1'}}>
                                            {this.generateInput(oneItem)}
                                        </div>
                                    </RactangleAlignChildrenLeft>}
                                </Fragment>);
                            }, this) : ''}

                            {this.state.add_metrics && this.state.metrics_plugin_name === 'influx' ? this.MetricsList.data.influx.map((oneItem, index) => {
                                return (<Fragment key={index}>
                                    {!oneItem.hidden &&
                                    <RactangleAlignChildrenLeft className={style['input-wrapper']}>
                                        <div style={{flex: '1'}}>
                                            {this.generateInput(oneItem)}
                                        </div>
                                    </RactangleAlignChildrenLeft>}
                                </Fragment>);
                            }, this) : ''}

                            <h3>{this.SMTPList.title}</h3>
                            <RactangleAlignChildrenLeft>
                                <UiSwitcher
                                    onChange={(value) => this.handleChangeForCheckBox('add_smtp_server', value)}
                                    disabledInp={false}
                                    activeState={this.state.add_smtp_server}
                                    height={12}
                                    width={22}/>
                            </RactangleAlignChildrenLeft>
                            {this.state.add_smtp_server ? this.SMTPList.data.map((oneItem, index) => {
                                return (<Fragment key={index}>
                                    {!oneItem.hidden &&
                                    <RactangleAlignChildrenLeft className={style['input-wrapper']}>
                                        <div style={{flex: '1'}}>
                                            {this.generateInput(oneItem)}
                                        </div>
                                    </RactangleAlignChildrenLeft>}
                                </Fragment>);
                            }, this) : ''}

                            <div className={style.buttons}>
                                <Button inverted onClick={this.closeDialog}>Cancel</Button>
                                <Button spinner={processingAction} hover disabled={!!this.isThereErrorOnForm()}
                                        onClick={this.whenSubmit}>Submit</Button>
                            </div>
                            { serverError &&
                            <ErrorDialog closeDialog={() => {clearErrorOnUpdateConfig()}} showMessage={serverError}/>
                            }
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

        if (this.state.add_metrics && this.state.metrics_plugin_name === 'prometheus') {
            this.MetricsList.data.prometheus.forEach((prometheusConfigEntry) => {
                delete body[prometheusConfigEntry.name];
            });
            body.prometheus_metrics = {
                push_gateway_url: this.state.push_gateway_url,
                buckets_sizes: this.state.buckets_sizes
            }
        } else if (this.state.add_metrics && this.state.metrics_plugin_name === 'influx') {
            this.MetricsList.data.influx.forEach((influxConfigEntry) => {
                delete body[influxConfigEntry.name];
            });
            body.influx_metrics = {
                host: this.state.influx_host,
                username: this.state.influx_username,
                password: this.state.influx_password,
                database: this.state.influx_database
            }
        }

        if (this.state.add_smtp_server) {
            this.SMTPList.data.forEach((SMTPConfigEntry) => {
                delete body[SMTPConfigEntry.name];
            });
            body.smtp_server = {
                host: this.state.smtp_host,
                port: this.state.smtp_port,
                username: this.state.smtp_username,
                password: this.state.smtp_password,
                from: this.state.smtp_from,
                timeout: this.state.smtp_timeout
            }
        }

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
        history.push('/');
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