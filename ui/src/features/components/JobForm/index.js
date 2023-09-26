import React, { Fragment } from 'react';
import style from './style.scss';
import { connect } from 'react-redux';
import { processingCreateJob, createJobSuccess, createJobFailure } from '../../redux/selectors/jobsSelector';
import { webhooksForDropdown } from '../../redux/selectors/webhooksSelector';
import * as Actions from '../../redux/action';
import ErrorDialog from '../ErrorDialog';
import RactangleAlignChildrenLeft from '../../../components/RectangleAlign/RectangleAlignChildrenLeft';
import { validate } from './validator';
import CronViewer from './cronViewer';
import Modal from '../Modal';
import TitleInput from '../../../components/TitleInput'
import Input from '../../../components/Input'
import FormWrapper from '../../../components/FormWrapper';
import ErrorWrapper from '../../../components/ErrorWrapper';
import TextArea from '../../../components/TextArea';
import MultiValueInput from '../../../components/MultiValueInput';
import UiSwitcher from '../../../components/UiSwitcher';
import { filter } from 'lodash';
import RadioOptions from '../../../components/RadioOptions';
import { inputTypes, testTypes } from './constants';
import MultiSelect from '../../../components/MultiSelect/MultiSelect.export';
import NumericInput from '../../../components/NumericInput';
import InfoToolTip from '../InfoToolTip';
import { faClock, faPlayCircle } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import IconButton from '../../../components/IconButton';
import { createJobRequest, createStateForEditJob } from './utils';
import Button from '../../../components/Button';
import SimpleTable from '../SimpleTable';
import { chaosExperimentsForDropdown } from '../../redux/selectors/chaosExperimentsSelector';
import Dropdown from '../../../components/Dropdown/Dropdown.export';

const DESCRIPTION = 'Predator executes tests through jobs. Use this form to specify the parameters for the job you want to execute.';

class Form extends React.Component {
  constructor (props) {
    super(props);
    this.FormList = [
      {
        name: 'test_name',
        key: 'test_name',
        disabled: true,
        floatingLabelText: 'Test Name',
        info: 'The test name that you are going to run.'
      },
      {
        name: 'type',
        key: 'type',
        disabled: false,
        floatingLabelText: 'Test Type',
        info: 'The type of test that you are going to run.',
        type: inputTypes.RADIO,
        options: ['Load test', 'Functional test'],
        optionToValue: { 'Load test': 'load_test', 'Functional test': 'functional_test' },
        valueToOption: { load_test: 'Load test', functional_test: 'Functional test' }
      },
      {
        group: 'section_a',
        bottom: [
          {
            name: 'mode',
            key: 'mode',
            floatingLabelText: 'Mode',
            info: 'Override calculated parallelism and max virtual users',
            type: inputTypes.SWITCHER_TWO_SIDES,
            justifyContent: 'flex-end',
            leftOption: 'Simple',
            rightOption: 'Expert',
            onChange: (value) => {
              const { disabled } = this.state;

              if (value === 'Expert') {
                this.setState({
                  disabled: {
                    ...disabled,
                    parallelism: false,
                    max_virtual_users: false
                  }
                })
              } else {
                this.setState({
                  disabled: {
                    ...disabled,
                    parallelism: true,
                    max_virtual_users: true
                  }
                })
              }
            }
          }
        ],
        children: [
          {
            name: 'arrival_rate',
            key: 'arrival_rate',
            floatingLabelText: 'Arrival rate',
            info: 'Number of scenarios per second that the test fires.',
            type: inputTypes.NUMERIC_INPUT,
            hiddenCondition: (state) => state.type === testTypes.FUNCTIONAL_TEST
          },
          {
            name: 'arrival_count',
            key: 'arrival_count',
            floatingLabelText: 'Arrival count',
            info: 'Fixed count of arrivals in the tests duration. Resembles the number of scenarios that will be run by the end of the test.',
            type: inputTypes.NUMERIC_INPUT,
            hiddenCondition: (state) => state.type === testTypes.LOAD_TEST,
            newState: (arrivalCount) => {
              const parallel = Math.ceil(arrivalCount / 1000);
              const maxVirtualUsers = parallel * 250;
              return { parallelism: parallel, max_virtual_users: maxVirtualUsers };
            }
          },
          {
            name: 'duration',
            key: 'duration',
            floatingLabelText: 'Duration (Minutes)',
            info: 'The duration of the test in minutes.',
            type: inputTypes.NUMERIC_INPUT

          },
          {
            name: 'ramp_to',
            key: 'ramp_to',
            floatingLabelText: 'Ramp to',
            info: 'A linear ramp up phase where the number of new arrivals increases linearly over the duration of the phase. The test starts with the Arrival Rate value until reaching this value.',
            hiddenCondition: (state) => state.type === testTypes.FUNCTIONAL_TEST,
            type: inputTypes.NUMERIC_WITH_SWITCH,
            switcherName: 'enable_ramp_to',
            onChangeSwitcher: (value) => {
              const { disabled } = this.state;
              if (value) {
                this.setState({
                  disabled: {
                    ...disabled,
                    ramp_to: false
                  }
                })
              } else {
                this.setState({
                  ramp_to: undefined,
                  disabled: {
                    ...disabled,
                    ramp_to: true
                  }
                })
              }
            }

          },
          {
            name: 'parallelism',
            key: 'parallelism',
            floatingLabelText: 'Parallelism',
            info: 'The amount of runners predator will start, arrival rate, ramp to and max virtual users will split between them.',
            type: inputTypes.NUMERIC_INPUT

          },
          {
            name: 'max_virtual_users',
            key: 'max_virtual_users',
            floatingLabelText: 'Max VUsers',
            info: 'Max concurrent number of users doing requests, if there is more requests that have not returned yet, requests will be dropped',
            type: inputTypes.NUMERIC_INPUT,
            defaultValue: '250'
          }
        ]
      },
      {
        group: 'section_b',
        children: [
          {
            name: 'emails',
            key: 'emails',
            floatingLabelText: 'Emails',
            info: 'When the test finishes, a report will be sent to the emails included.',
            element: 'Email',
            type: inputTypes.INPUT_LIST,
            values: (state) => state['emails'].map((value) => ({ value, label: value })),
            flexBasis: '49%'
          },
          {
            name: 'webhooks',
            key: 'webhooks',
            floatingLabelText: 'Webhooks',
            info: 'Send test reports to Slack.',
            element: 'Webhook',
            type: inputTypes.MULTI_SELECT,
            options: (props) => props.webhooks,
            flexBasis: '49%'
          }
        ]
      },
      ...(props.experiments.length > 0 ? [{
        group: 'section_c',
        children:
            [
              {
                name: 'experiments',
                key: 'experiments',
                floatingLabelText: 'Running Experiments',
                info: 'Chaos experiments running within the test',
                element: 'RunningExperiments',
                type: inputTypes.LIST,
                rows: (state) => state.experiments.map((experiment, index) => {
                  return [
                    <div key={'header' + index} className={style['list-container']}>
                      <span className={style['list-item__title']}>experiment name:</span>
                      <span className={style['list-item']}> {experiment.experiment_name}</span>
                      <span className={style['list-item__title']}>start at:</span>
                      <span className={style['list-item']}> {experiment.start_after}</span>
                    </div>
                  ]
                }),
                flexBasis: '80%'
              },
              {
                name: 'add_experiment_option',
                key: 'add_experiment_option',
                floatingLabelText: '+Add Experiment',
                onClick: () => {
                  this.setState({
                    add_experiment_form_experiment_name: '',
                    add_experiment_form_experiment_id: '',
                    add_experiment_form_start_after: 0,
                    add_experiment_form_hidden: false
                  })
                },
                type: inputTypes.LINK_ACTION,
                justifyContent: 'flex-end'
              },
              {
                name: 'add_experiment_form_experiment_name',
                key: 'add_experiment_form_experiment_name',
                floatingLabelText: 'Experiment',
                list: (props) => props.experiments,
                placeholder: 'Select experiment to run',
                element: 'new_experiment',
                selectedOption: (state) => ({ key: state.add_experiment_form_experiment_id, value: state.add_experiment_form_experiment_name }),
                type: inputTypes.DROPDOWN,
                onChange: ({ value, key }) => {
                  this.setState({
                    add_experiment_form_experiment_name: value,
                    add_experiment_form_experiment_id: key
                  })
                },
                flexBasis: '49%',
                hiddenCondition: (state) => state.add_experiment_form_hidden === true
              },
              {
                name: 'add_experiment_form_start_after',
                key: 'add_experiment_form_start_after',
                floatingLabelText: 'Start At',
                info: 'When to start the experiment within the test timeframe (milliseconds)',
                element: 'StartAt',
                type: inputTypes.NUMERIC_INPUT,
                justifyContent: 'flex-end',
                height: '35px',
                hiddenCondition: (state) => state.add_experiment_form_hidden === true
              },
              {
                name: 'add_experiment_submit',
                key: 'add_experiment_submit',
                floatingLabelText: 'Add',
                element: 'AddExperiment',
                type: inputTypes.SUBMIT_BUTTON,
                inverted: true,
                justifyContent: 'flex-end',
                paddingTop: '22px',
                height: '35px',
                onClick: () => {
                  const newExperiment = {
                    experiment_id: this.state.add_experiment_form_experiment_id,
                    experiment_name: this.state.add_experiment_form_experiment_name,
                    start_after: this.state.add_experiment_form_start_after
                  }
                  const experiments = [...this.state.experiments, newExperiment]
                  this.state.experiments.push(newExperiment)
                  this.setState((prevState) => {
                    return {
                      ...prevState,
                      experiments: experiments,
                      add_experiment_form_hidden: true
                    }
                  })
                  console.log(this.state.experiments)
                },
                disabled: (state) => state.add_experiment_form_experiment_name.trim().length === 0 || state.add_experiment_form_start_after === 0,
                hiddenCondition: (state) => state.add_experiment_form_hidden === true
              }
            ]
      }] : []),
      {
        group: 'section_d',
        flexDirection: 'column',
        children: [
          {
            name: 'debug',
            key: 'debug',
            label: 'Debug',
            info: 'Turn on debug to log request and response in the load generators',
            type: inputTypes.SWITCHER
          },
          {
            name: 'cron_expression',
            key: 'cron_expression',
            floatingLabelText: 'Cron expression',
            info: 'Schedule a reoccurring job using this. For example, cron expression: "0 0 22 * * *" runs the test every day at 22:00 UTC.'
          },

          {
            name: 'notes',
            key: 'notes',
            floatingLabelText: 'Notes',
            element: 'notes',
            info: 'Add notes about the test.',
            type: inputTypes.TEXT_FIELD
          }
        ]
      }

    ];
    this.state = {
      test_id: this.props.data ? this.props.data.id : '',
      test_name: this.props.data ? this.props.data.name : '',
      arrival_rate: undefined,
      arrival_count: undefined,
      duration: undefined,
      ramp_to: undefined,
      environment: 'test',
      cron_expression: undefined,
      run_immediately: false,
      emails: [],
      webhooks: [],
      experiments: [],
      helpInfo: undefined,
      parallelism: undefined,
      max_virtual_users: undefined,
      type: 'load_test',
      enable_ramp_to: false,
      errors: {
        name: undefined,
        retries: undefined,
        uris: undefined,
        upstream_url: undefined,
        upstream_send_timeout: undefined,
        upstream_read_timeout: undefined,
        upstream_connect_timeout: undefined
      },
      disabled: {
        ramp_to: true,
        parallelism: true,
        max_virtual_users: true
      },
      mode: 'Simple',
      add_experiment_form_hidden: true,
      add_experiment_form_experiment_id: '',
      add_experiment_form_experiment_name: '',
      add_experiment_form_start_after: 0
    };

    if (this.props.editMode) {
      const editProps = createStateForEditJob(this.props.data);
      this.state = {
        ...this.state,
        ...editProps
      };
    }

    this.state.errors = validate(this.state);
    this.FormList.forEach((item) => {
      if (item.defaultValue) {
        this.state[item.name] = item.defaultValue;
      }
    });
  }

    handleChangeForCheckBox = (name, value) => {
      const newState = Object.assign({}, this.state, { [name]: value });
      newState.errors = validate(newState);
      this.setState(newState);
    };

    componentWillUnmount () {
      this.props.clearErrorOnCreateJob();
    }

    componentDidMount () {
      this.props.getWebhooks();
      this.props.getChaosExperiments();
    }

    componentDidUpdate (prevProps, prevState, snapshot) {
      if ((prevState.type !== this.state.type) ||
          (prevState.mode === 'Expert' && this.state.mode === 'Simple') ||
            (this.state.mode === 'Simple' &&
                (prevState.arrival_count !== this.state.arrival_count || prevState.arrival_rate !== this.state.arrival_rate || prevState.ramp_to !== this.state.ramp_to))) {
        let parallel;
        if (this.state.type === 'load_test') {
          parallel = this.state.ramp_to > this.state.arrival_rate ? Math.ceil(this.state.ramp_to / 1000) : Math.ceil(this.state.arrival_rate / 1000)
        } else {
          parallel = Math.ceil(this.state.arrival_count / 1000);
        }
        const maxVirtualUsers = parallel * 250;
        this.setState({ parallelism: parallel, max_virtual_users: maxVirtualUsers })
      }
      if (this.props.webhooks !== prevProps.webhooks && this.props.editMode) {
        const newState = createStateForEditJob(this.props.data, this.props.webhooks);
        this.setState({ ...newState });
      }
    }

    onChangeProperty = (name, value) => {
      const newState = Object.assign({}, this.state, { [name]: value });
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
        [target]: filter(this.state[target], (cur) => (cur !== element))
      });
    };

    isThereErrorOnForm () {
      let state = this.state;

      return (Object.values(state.errors).find((oneError) => {
        return oneError !== undefined;
      }));
    }

    render () {
      const { closeDialog, processingAction, serverError, clearErrorOnCreateJob, editMode } = this.props;
      return (
        <Modal maxWidth={'760px'} onExit={closeDialog}>
          <FormWrapper style={{ height: null }} title={editMode ? 'Edit job' : 'Create a new job'} description={DESCRIPTION}>
            <div style={{ width: '100%' }}>
              {this.FormList.map((oneItem, index) => {
                if (oneItem.group) {
                  return (
                    <div key={index} className={style['input-wrapper']} style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      border: '1px solid rgb(85, 126, 255)',
                      padding: '12px',
                      justifyContent: 'space-between',
                      flexDirection: oneItem.flexDirection
                    }}>
                      {oneItem.children.map((childItem, index) => {
                        return (
                          <Fragment key={index}>
                            {!(childItem.hiddenCondition && childItem.hiddenCondition(this.state)) &&
                            <div style={{ marginBottom: '10px', flexBasis: childItem.flexBasis }}>
                              {this.generateInput(childItem)}
                            </div>

                            }
                          </Fragment>
                        )
                      })}
                      {oneItem.bottom && <div style={{ marginTop: '13px', flexBasis: '100%' }}>
                        {oneItem.bottom.map(childItem => {
                          return (
                            <Fragment key={index}>
                              {this.generateInput(childItem)}
                            </Fragment>
                          )
                        })}
                      </div>
                      }
                    </div>
                  )
                }

                return (<Fragment key={index}>
                  {!(oneItem.hiddenCondition && oneItem.hiddenCondition(this.state)) &&
                  <RactangleAlignChildrenLeft className={style['input-wrapper']}>
                    <div style={{ flex: '1' }}>
                      {this.generateInput(oneItem)}
                    </div>
                  </RactangleAlignChildrenLeft>}
                </Fragment>);
              }, this)}
              <div className={style.icons}>
                <IconButton style={{ marginRight: '8px' }}
                  spinner={processingAction}
                  disabled={!this.state.cron_expression || !!this.isThereErrorOnForm()}
                  onClick={() => { this.whenSubmit(false) }}
                  inverted
                  width='28px'
                  height='28px'
                  title='Schedule'>
                  <FontAwesomeIcon icon={faClock} size='2x' />
                </IconButton>
                {!editMode && <IconButton
                  spinner={processingAction}
                  disabled={!!this.isThereErrorOnForm()}
                  onClick={() => this.whenSubmit(true)}
                  inverted
                  width='28px'
                  height='28px'
                  title={this.state.cron_expression ? 'Schedule & Run' : 'Run'}>
                  <FontAwesomeIcon icon={faPlayCircle} size='2x' />
                </IconButton>}
              </div>
              {serverError &&
              <ErrorDialog closeDialog={() => {
                clearErrorOnCreateJob()
              }} showMessage={serverError} />
              }
            </div>
          </FormWrapper>
        </Modal>
      );
    }

    generateInput = (oneItem) => {
      const startsWithStrategy = ({ array = [], propName, value }) => {
        const lowerCaseValue = value.toLowerCase();
        return array.filter(object => object[propName].toLowerCase().startsWith(lowerCaseValue))
      };

      const { cron_expression } = this.state;
      switch (oneItem.type) {
      case inputTypes.LINK_ACTION:
        return (
          <RactangleAlignChildrenLeft>
            <div
              className={style['actions-style']}
              onClick={oneItem.onClick}>
              {oneItem.floatingLabelText}
            </div>
          </RactangleAlignChildrenLeft>
        )
      case inputTypes.SUBMIT_BUTTON:
        return (
          <RactangleAlignChildrenLeft style={{ flexBasis: oneItem.flexDirection, paddingTop: oneItem.paddingTop }}>
            <Button
              disabled={oneItem.disabled(this.state)}
              className={style['actions-style']}
              inverted={oneItem.inverted}
              onClick={oneItem.onClick}>
              {oneItem.floatingLabelText}
            </Button>
          </RactangleAlignChildrenLeft>
        )
      case inputTypes.SWITCHER:
        return (
          <RactangleAlignChildrenLeft>
            <UiSwitcher
              onChange={(value) => this.handleChangeForCheckBox(oneItem.name, value)}
              disabledInp={false}
              activeState={this.state[oneItem.name]}
              height={12}
              width={22} />
            <div className={style['run-immediately']}>{oneItem.label}</div>
            <InfoToolTip style={{ marginLeft: 'auto' }} data={oneItem} />
          </RactangleAlignChildrenLeft>

        );
      case inputTypes.SWITCHER_TWO_SIDES:
        return (
          <RactangleAlignChildrenLeft style={{ justifyContent: oneItem.justifyContent }}>
            <div style={{ marginRight: '5px', fontSize: '10px', color: '#557eff' }}>{oneItem.leftOption}</div>
            <UiSwitcher
              onChange={(value) => {
                const actualValue = value ? oneItem.rightOption : oneItem.leftOption;
                this.handleChangeForCheckBox(oneItem.name, actualValue)
                oneItem.onChange && oneItem.onChange(actualValue)
              }}
              disabledInp={false}
              activeState={this.state[oneItem.name] === oneItem.rightOption}
              height={10}
              width={20} />
            <div style={{ marginLeft: '5px', fontSize: '10px', color: '#557eff', marginRight: '5px' }}>{oneItem.rightOption}</div>
            <InfoToolTip data={oneItem} iconSize={'10px'} />
          </RactangleAlignChildrenLeft>
        );
      case inputTypes.LIST: {
        return (
          <TitleInput key={oneItem.key} title={oneItem.floatingLabelText}
            rightComponent={<InfoToolTip data={oneItem} />}>
            <SimpleTable style={{ paddingLeft: '40px', paddingRight: '40px', marginBottom: '5px' }}
              rows={oneItem.rows(this.state)} />
          </TitleInput>
        )
      }
      case inputTypes.INPUT_LIST:
        return (
          <TitleInput key={oneItem.key} title={oneItem.floatingLabelText}
            rightComponent={<InfoToolTip data={oneItem} />}>
            <MultiValueInput
              disabled={oneItem.disabled}
              values={oneItem.values(this.state)}
              onAddItem={(evt) => this.handleInputListAdd(oneItem.name, evt)}
              onRemoveItem={evt => this.handleInputListRemove(oneItem.name, evt)}
              // validationFunc={validateFunc}
            />
          </TitleInput>

        );
      case inputTypes.DROPDOWN:
        return (
          <TitleInput key={oneItem.key} title={oneItem.floatingLabelText}
            rightComponent={<InfoToolTip data={oneItem} />}>
            <Dropdown
              options={oneItem.list(this.props)}
              selectedOption={oneItem.selectedOption(this.state)}
              onChange={oneItem.onChange}
              placeHolder={oneItem.placeholder}
            />
          </TitleInput>
        )
      case inputTypes.TEXT_FIELD:
        return (
          <TitleInput key={oneItem.key} title={oneItem.floatingLabelText}
            rightComponent={<InfoToolTip data={oneItem} />}>
            <ErrorWrapper errorText={this.state.errors[oneItem.name]}>
              <TextArea
                disabled={oneItem.disabled}
                onChange={(evt) => this.onChangeProperty(oneItem.name, evt.target.value)}
                value={this.state[oneItem.name]}
              />
            </ErrorWrapper>
          </TitleInput>
        );
      case inputTypes.RADIO:
        return (
          <TitleInput key={oneItem.key} title={oneItem.floatingLabelText}
            rightComponent={<InfoToolTip data={oneItem} />}>
            <ErrorWrapper errorText={this.state.errors[oneItem.name]}>
              <RadioOptions value={oneItem.valueToOption[this.state[oneItem.name]]} list={oneItem.options}
                onChange={(value) => {
                  this.onChangeProperty(oneItem.name, oneItem.optionToValue[value]);
                  oneItem.onChange && oneItem.onChange(oneItem.optionToValue[value]);
                }} />
            </ErrorWrapper>
          </TitleInput>
        );
      case inputTypes.MULTI_SELECT:
        const options = oneItem.options(this.props);
        return (
          <TitleInput key={oneItem.key} title={oneItem.floatingLabelText}
            rightComponent={<InfoToolTip data={oneItem} />}>
            <ErrorWrapper errorText={this.state.errors[oneItem.name]}>
              <MultiSelect
                options={options}
                selectedOptions={options.length > 0 ? this.state[oneItem.name] : []}
                onChange={(values) => this.onChangeProperty(oneItem.name, values)}
                placeholder={'Please select an option'}
                height={'35px'}
                disabled={false}
                maxSize={50}
                validationErrorText=''
                enableFilter
                filteringStrategy={startsWithStrategy}
                enableSelectAll
                selectAllText={'Check All'}
                enableEllipsis
              />
            </ErrorWrapper>
          </TitleInput>
        );
      case inputTypes.NUMERIC_INPUT:
        return (
          <RactangleAlignChildrenLeft style={{ justifyContent: oneItem.justifyContent }}>
            <TitleInput labelStyle={{ marginRight: '5px' }} key={oneItem.key} title={oneItem.floatingLabelText}
              rightComponent={<InfoToolTip data={oneItem} />}>
              <ErrorWrapper errorText={this.state.errors[oneItem.name]}>
                <NumericInput
                  minValue={0}
                  maxValue={10000000}
                  height={oneItem.height}
                  hideNumber={Number.isNaN(this.state[oneItem.name])}
                  value={this.state[oneItem.name]}
                  onChange={(value) => {
                    this.onChangeProperty(oneItem.name, value)
                    const newState = oneItem.newState && oneItem.newState(value);
                    this.setState(newState);
                  }}
                  disabled={this.state.disabled[oneItem.name]}
                  width={'80px'}
                />
              </ErrorWrapper>
            </TitleInput>
          </RactangleAlignChildrenLeft>
        );
      case inputTypes.NUMERIC_WITH_SWITCH:
        return (
          <TitleInput labelStyle={{ marginLeft: '5px', marginRight: '5px' }} key={oneItem.key} title={oneItem.floatingLabelText}
            leftComponent={<UiSwitcher
              onChange={(value) => {
                this.handleChangeForCheckBox(oneItem.switcherName, value)
                oneItem.onChangeSwitcher && oneItem.onChangeSwitcher(value);
              }}
              disabledInp={false}
              activeState={this.state[oneItem.switcherName]}
              height={10}
              width={18} />
            }
            rightComponent={<InfoToolTip data={oneItem} />}>
            <ErrorWrapper errorText={this.state.errors[oneItem.name]}>
              <NumericInput
                minValue={0}
                maxValue={10000000}
                hideNumber={Number.isNaN(this.state[oneItem.name])}
                value={this.state[oneItem.name]}
                onChange={(value) => {
                  this.onChangeProperty(oneItem.name, value)
                  const newState = oneItem.newState && oneItem.newState(value);
                  this.setState(newState);
                }}
                disabled={this.state.disabled[oneItem.name]}
                width={'80px'}
              />
            </ErrorWrapper>
          </TitleInput>
        );
      default:
        return (
          <div>
            <TitleInput key={oneItem.key} title={oneItem.floatingLabelText}
              rightComponent={<InfoToolTip data={oneItem} />}>
              <ErrorWrapper errorText={this.state.errors[oneItem.name]}>
                <Input
                  disabled={oneItem.disabled}
                  value={this.state[oneItem.name]}
                  onChange={(evt) => this.onChangeProperty(oneItem.name, evt.target.value)} />
              </ErrorWrapper>
            </TitleInput>
            {oneItem.name === 'cron_expression' && !this.state.errors['cron_expression'] && <CronViewer value={cron_expression} />}
          </div>

        );
      }
    };

    whenSubmit = (runImmediate) => {
      const convertedArgs = {
        test_id: this.props.editMode ? this.state.test_id : this.props.data.id,
        duration: parseInt(this.state.duration) * 60,
        run_immediately: runImmediate,
        ramp_to: this.state.enable_ramp_to ? this.state.ramp_to : undefined
      };
      if (this.state.debug) {
        convertedArgs.debug = '*';
      }

      if (this.state.webhooks) {
        convertedArgs.webhooks = this.state.webhooks.map((webhook) => webhook.key);
      }

      const jobData = {
        ...this.state,
        ...convertedArgs
      };

      if (this.props.editMode) {
        this.props.editJob(jobData.id, jobData);
        this.props.closeDialog();
      } else {
        this.props.createJob(createJobRequest(jobData));
      }
    };
}

function mapStateToProps (state) {
  return {
    processingAction: processingCreateJob(state),
    serverError: createJobFailure(state),
    createJobSuccess: createJobSuccess(state),
    webhooks: webhooksForDropdown(state),
    experiments: chaosExperimentsForDropdown(state)
  };
}

const mapDispatchToProps = {
  clearErrorOnCreateJob: Actions.clearErrorOnCreateJob,
  createJob: Actions.createJob,
  editJob: Actions.editJob,
  getWebhooks: Actions.getWebhooks,
  getChaosExperiments: Actions.getChaosExperiments
};

export default connect(mapStateToProps, mapDispatchToProps)(Form);
