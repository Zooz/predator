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
import Button from '../../../components/Button'
import TitleInput from '../../../components/TitleInput'
import Input from '../../../components/Input'
import FormWrapper from '../../../components/FormWrapper';
import ErrorWrapper from '../../../components/ErrorWrapper';
import TextArea from '../../../components/TextArea';
import MultiValueInput from '../../../components/MultiValueInput';
import UiSwitcher from '../../../components/UiSwitcher';
import { filter } from 'lodash';
import { createJobRequest } from '../../requestBuilder';
import RadioOptions from '../../../components/RadioOptions';
import { inputTypes, testTypes } from './constants';
import MultiSelect from '../../../components/MultiSelect/MultiSelect.export';
import NumericInput from '../../../components/NumericInput';
import InfoToolTip from '../InfoToolTip';

const DESCRIPTION = 'Predator executes tests through jobs. Use this form to specify the parameters for the job you want to execute.';

const sectionA = 'sectionA';

class Form extends React.Component {
  constructor (props) {
    super(props);
    this.FormList = [
      {
        name: 'test_id',
        key: 'id',
        disabled: true,
        floatingLabelText: 'Test Id',
        info: 'The test id used to find the test in the API.'
      },
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
        name: 'notes',
        key: 'notes',
        floatingLabelText: 'Notes',
        element: 'notes',
        info: 'Add notes about the test.',
        type: inputTypes.TEXT_FIELD
      },
      {
        name: 'webhooks',
        key: 'webhooks',
        floatingLabelText: 'Webhooks',
        info: 'Send test reports to Slack.',
        element: 'Webhook',
        type: inputTypes.MULTI_SELECT,
        options: (props) => props.webhooks
      },
      {
        name: 'mode',
        key: 'mode',
        floatingLabelText: 'Mode',
        info: 'choose mode',
        type: inputTypes.RADIO,
        options: ['Simple', 'Expert'],
        optionToValue: { Simple: 'Simple', Expert: 'Expert' },
        valueToOption: { Simple: 'Simple', Expert: 'Expert' },
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
      },
      {
        group: sectionA,
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
            type: inputTypes.NUMERIC_INPUT

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
            floatingLabelText: 'Max virtual users',
            info: 'Max concurrent number of users doing requests, if there is more requests that have not returned yet, requests will be dropped',
            type: inputTypes.NUMERIC_INPUT,
              defaultValue: '250'
          }
        ]
      },
      {
        name: 'environment',
        key: 'environment',
        floatingLabelText: 'Environment',
        info: 'The chosen environment to test. Free text used to logically separate between tests runs'
      },
      {
        name: 'cron_expression',
        key: 'cron_expression',
        floatingLabelText: 'Cron expression',
        info: 'Schedule a reoccurring job using this. For example, cron expression: "0 0 22 * * *" runs the test every day at 22:00 UTC.'
      },
      {
        name: 'run_immediately',
        key: 'run_immediately',
        label: 'Run immediately',
        // info: 'Schedule a one time job, which will run the test now.',
        type: inputTypes.SWITCHER
      },
      {
        name: 'debug',
        key: 'debug',
        label: 'Debug',
        info: 'Turn on debug to log request and response in the load generators',
        type: inputTypes.SWITCHER
      },
      {
        name: 'emails',
        key: 'emails',
        floatingLabelText: 'Emails',
        info: 'When the test finishes, a report will be sent to the emails included.',
        element: 'Email',
        type: inputTypes.INPUT_LIST
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
      helpInfo: undefined,
      parallelism: undefined,
      max_virtual_users: undefined,
      type: 'load_test',
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
        parallelism: true,
        max_virtual_users: true

      },
      mode: 'Simple'
    };
    this.state.errors = validate(this.state);
    this.FormList.forEach((item) => {
      if (item.defaultValue) {
        this.state[item.name] = item.defaultValue;
      }
    });

    // this.groups = this.FormList.reduce((acc, fieldData) => {
    //     if (fieldData.group) {
    //         acc[fieldData.group] = acc[fieldData.group] ? acc[fieldData.group].push(fieldData) : [fieldData];
    //     } else {
    //         acc.default.push(fieldData);
    //     }
    //
    //     return acc;
    // }, [])
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
    }

    componentDidUpdate (prevProps, prevState, snapshot) {
      if (this.state.mode === 'Simple' &&
          (prevState.arrival_count !== this.state.arrival_count || prevState.arrival_rate !== this.state.arrival_rate || prevState.ramp_to !== this.state.ramp_to)) {
        let parallel;
        if (this.state.type === 'load_test') {
          parallel = this.state.ramp_to > this.state.arrival_rate ? Math.ceil(this.state.ramp_to / 1000) : Math.ceil(this.state.arrival_rate / 1000)
        } else {
          parallel = Math.ceil(this.state.arrival_count / 1000);
        }
        const maxVirtualUsers = parallel * 250;
        this.setState({ parallelism: parallel, max_virtual_users: maxVirtualUsers })
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
      const { closeDialog, processingAction, serverError, clearErrorOnCreateJob } = this.props;
      return (
        <Modal style={{ paddingTop: '64px' }} width={'50%'} onExit={closeDialog}>
          <FormWrapper style={{ height: null }} title={'Create a new job'} description={DESCRIPTION}>
            <div style={{ width: '100%' }}>
              {this.FormList.map((oneItem, index) => {
                if (oneItem.group) {
                  return (
                    <div key={index} className={style['input-wrapper']} style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      border: '1px solid rgb(85, 126, 255)',
                      padding: '10px',
                      justifyContent: 'space-between'
                    }}>
                      {oneItem.children.map((childItem, index) => {
                        return (
                          <Fragment key={index}>
                            {!(childItem.hiddenCondition && childItem.hiddenCondition(this.state)) &&
                            <div style={{ marginBottom: '10px' }}>
                              {this.generateInput(childItem)}
                            </div>

                            }
                          </Fragment>
                        )
                      })}
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
              <div className={style.buttons}>
                <Button inverted onClick={closeDialog}>Cancel</Button>
                <Button spinner={processingAction} hover disabled={!!this.isThereErrorOnForm()}
                  onClick={this.whenSubmit}>Submit</Button>
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
      case inputTypes.SWITCHER:
        return (
          <TitleInput style={{ flex: '1' }} key={oneItem.key} title={oneItem.floatingLabelText}
            rightComponent={<InfoToolTip data={oneItem} />}>
            <RactangleAlignChildrenLeft>
              <UiSwitcher
                onChange={(value) => this.handleChangeForCheckBox(oneItem.name, value)}
                disabledInp={false}
                activeState={this.state[oneItem.name]}
                height={12}
                width={22} />
              <div className={style['run-immediately']}>{oneItem.label}</div>
            </RactangleAlignChildrenLeft>
          </TitleInput>

        );
      case inputTypes.INPUT_LIST:
        return (
          <TitleInput key={oneItem.key} title={oneItem.floatingLabelText}
            rightComponent={<InfoToolTip data={oneItem} />}>
            <MultiValueInput
              values={this.state[oneItem.name].map((value) => ({ value, label: value }))}
              onAddItem={(evt) => this.handleInputListAdd(oneItem.name, evt)}
              onRemoveItem={evt => this.handleInputListRemove(oneItem.name, evt)}
              // validationFunc={validateFunc}
            />
          </TitleInput>

        );

      case inputTypes.TEXT_FIELD:
        return (
          <TitleInput key={oneItem.key} title={oneItem.floatingLabelText}
            rightComponent={<InfoToolTip data={oneItem} />}>
            <ErrorWrapper errorText={this.state.errors[oneItem.name]}>
              <TextArea
                disabled={oneItem.disabled}
                onChange={(evt) => this.onChangeProperty(oneItem.name, evt.target.value)}

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
        return (
          <TitleInput key={oneItem.key} title={oneItem.floatingLabelText}
            rightComponent={<InfoToolTip data={oneItem} />}>
            <ErrorWrapper errorText={this.state.errors[oneItem.name]}>
              <MultiSelect
                options={oneItem.options(this.props)}
                selectedOptions={this.state[oneItem.name]}
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
        //  TODO ADD IS NUMBER FOR HIDE NUMBER
        return (
          <TitleInput labelStyle={{ marginRight: '5px' }} key={oneItem.key} title={oneItem.floatingLabelText}
            rightComponent={<InfoToolTip data={oneItem} />}>
            <ErrorWrapper errorText={this.state.errors[oneItem.name]}>
              <NumericInput
                minValue={0}
                maxValue={100000}
                hideNumber={!this.state[oneItem.name]}
                value={this.state[oneItem.name]}
                onChange={(value) => {
                  this.onChangeProperty(oneItem.name, value)
                  const newState = oneItem.newState && oneItem.newState(value);
                  this.setState(newState);
                }}
                disabled={this.state.disabled[oneItem.name]}

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
            {oneItem.name === 'cron_expression' && <CronViewer value={cron_expression} />}
          </div>

        );
      }
    };

    whenSubmit = () => {
      const convertedArgs = {
        test_id: this.props.data.id,
        duration: parseInt(this.state.duration) * 60
      };
      if (this.state.debug) {
        convertedArgs.debug = '*';
      }

      if (this.state.webhooks) {
        convertedArgs.webhooks = this.state.webhooks.map((webhook) => webhook.key);
      }

      this.props.createJob(createJobRequest(Object.assign({}, this.state, convertedArgs)));
    };
}

function mapStateToProps (state) {
  return {
    processingAction: processingCreateJob(state),
    serverError: createJobFailure(state),
    createJobSuccess: createJobSuccess(state),
    webhooks: webhooksForDropdown(state)
  };
}

const mapDispatchToProps = {
  clearErrorOnCreateJob: Actions.clearErrorOnCreateJob,
  createJob: Actions.createJob,
  getWebhooks: Actions.getWebhooks
};

export default connect(mapStateToProps, mapDispatchToProps)(Form);
