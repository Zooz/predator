import React, { Fragment } from 'react';
import style from './style.scss'
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import Checkbox from 'material-ui/Checkbox';
import { connect } from 'react-redux'
import { processingCreateJob, createJobSuccess, createJobFailure } from '../../instance/redux/selectors/jobsSelector';
import * as Actions from '../../instance/redux/action';
import Loader from '../Loader'
import InputList from '../InputList'
import ErrorDialog from '../ErrorDialog'
import classNames from 'classnames';
import TooltipWrapper from '../../../../components/TooltipWrapper';
import RactangleAlignChildrenLeft from '../../../../components/RectangleAlign/RectangleAlignChildrenLeft';

const inputTypes = {
  INPUT_LIST: 'INPUT_LIST',
  CHECKBOX: 'CHECKBOX',
  TEXT_FIELD: 'TEXT_FIELD'
};

class Form extends React.Component {
  constructor (props) {
    super(props);
    this.FormList = [
      {
        width: 350,
        name: 'id',
        key: 'id',
        disabled: true,
        floatingLabelText: 'Test Id',
        info: 'The test id used to find the test in the API.'
      },
      {
        width: 350,
        name: 'notes',
        key: 'notes',
        floatingLabelText: 'Notes',
        handleChange: this.handleChangeOptionalField,
        element: 'notes',
        info: 'Add notes about the test.',
        type: inputTypes.TEXT_FIELD
      },
      {
        width: 350,
        name: 'arrival_rate',
        key: 'arrival_rate',
        floatingLabelText: 'Arrival rate',
        handleChange: this.handleChangeIntegerMandatory,
        info: 'Number of scenarios per second that the test fires.'
      },
      {
        width: 350,
        name: 'duration',
        key: 'duration',
        floatingLabelText: 'Duration',
        handleChange: this.handleChangeIntegerMandatory,
        info: 'The duration of the test in seconds.'
      },
      {
        width: 350,
        name: 'ramp_to',
        key: 'ramp_to',
        floatingLabelText: 'Ramp to',
        handleChange: this.handleChangeOptionalField,
        info: 'A linear ramp up phase where the number of new arrivals increases linearly over the duration of the phase. The test starts with the Arrival Rate value until reaching this value.'
      },
      {
        width: 350,
        name: 'parallelism',
        key: 'parallelism',
        floatingLabelText: 'Parallelism',
        handleChange: this.handleChangeOptionalField,
        info: 'The amount of runners predator will start, arrival rate, ramp to and max virtual users will split between them.'
      },
      {
        width: 350,
        name: 'max_virtual_users',
        key: 'max_virtual_users',
        floatingLabelText: 'Max virtual users',
        handleChange: this.handleChangeOptionalField,
        info: 'Max concurrent number of users doing requests, if there is more requests that have not returned yet, requests will be dropped'
      },
      {
        width: 350,
        name: 'environment',
        key: 'environment',
        floatingLabelText: 'Environment',
        handleChange: this.handleChangeForDropDown,
        info: 'The chosen environment to test. Free text used to logically separate between tests runs'
      },
      {
        width: 350,
        name: 'cron_expression',
        key: 'cron_expression',
        floatingLabelText: 'Cron expression',
        handleChange: this.handleChangeOptionalField,
        info: 'Schedule a reoccurring job using this. For example, cron expression: "0 0 22 * * *" runs the test every day at 22:00 UTC.'
      },
      {
        width: 350,
        name: 'run_immediately',
        key: 'run_immediately',
        label: 'Run immediately',
        handleChange: this.handleChangeForCheckBox,
        info: 'Schedule a one time job, which will run the test now.',
        type: inputTypes.CHECKBOX
      },
      {
        width: 350,
        name: 'emails',
        key: 'emails',
        floatingLabelText: 'Emails',
        handleChange: this.handleInputListAdd,
        info: 'When the test finishes, a report will be sent to the emails included.',
        element: 'Email',
        type: inputTypes.INPUT_LIST
      },
      {
        width: 350,
        name: 'webhooks',
        key: 'webhooks',
        floatingLabelText: 'Webhooks',
        handleChange: this.handleInputListAdd,
        info: 'Send test reports to Slack.',
        element: 'Webhook',
        type: inputTypes.INPUT_LIST
      }

    ];

    this.state = {
      test_id: this.props.data ? this.props.data.id : '',
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
    }
  }

  static getDerivedStateFromProps (nextProps, prevState) {
    let jobDetails = nextProps.jobDetails || {};

    const newState = {
      test_id: prevState.test_id || jobDetails.test_id,
      arrival_rate: prevState.arrival_rate || jobDetails.arrival_rate,
      duration: prevState.duration || jobDetails.duration,
      ramp_to: prevState.ramp_to || jobDetails.ramp_to,
      environment: prevState.environment || jobDetails.environment,
      cron_expression: prevState.cron_expression || jobDetails.cron_expression,
      run_immediately: (prevState.run_immediately || jobDetails.run_immediately),
      emails: prevState.emails || jobDetails.emails,
      webhooks: prevState.webhooks || jobDetails.webhooks,
      helpInfo: prevState.helpInfo || jobDetails.helpInfo
    };

    return newState;
  };

    handleChangeForCheckBox = (name, evt) => {
      this.setState({ [name]: evt.target.checked });
    };

    handleChangeOptionalField = (name, evt) => {
      this.setState({ [name]: evt.target.value });
    };

    static isNormalInteger (str) {
      const n = Math.floor(Number(str));
      return n !== Infinity && String(n) === str && n >= 0;
    }

    handleChangeIntegerMandatory = (name, evt) => {
      this.setState({ [name]: evt.target.value });
      if (!Form.isNormalInteger(evt.target.value)) {
        this.setState({
          errors: {
            ...this.state.errors,
            [name]: `${name} field have to be Integer`
          }
        })
      } else {
        this.setState({
          errors: {
            ...this.state.errors,
            [name]: undefined
          }
        })
      }
    };

    handleInputListAdd = (target, newElement) => {
      this.setState({
        [target]: [...this.state[target], newElement]
      });
    };

    returnAllTests = () => {
      this.props.onCancel();
      this.props.history.push('/tests');
    };

    closeViewErrorDialog = () => {
      this.props.clearErrorOnCreateJob();
    };

    showValue (newValue, oldValues, field) {
      let oldValue = (oldValues ? oldValues[field] : undefined);
      return this.props.serverError ? oldValue : newValue
    }

    isThereErrorOnForm () {
      let state = this.state;

      return (Object.values(state.errors).find((oneError) => {
        return oneError !== undefined
      }))
    }

    handleChangeForDropDown (name, evt, value) {
      this.setState({
        environment: evt.target.value
      });
    }

    showInfo (item) {
      const helpClass = classNames('material-icons');
      return <TooltipWrapper
        content={
          <div>
            {item.info}
          </div>}
        dataId={`tooltipKey_${item.key}`}
        place='top'
        offset={{ top: 1 }}
      >
        <div data-tip data-for={`tooltipKey_${item.info}`} style={{ cursor: 'pointer' }}>
          <i style={{ color: '#CCCCCC' }} className={helpClass}>help_outline</i>
        </div>

      </TooltipWrapper>;
    }

    render () {
      const testDetails = this.props.data;

      return (
        <div>
          <div className={style.form}>
            {this.FormList.map((oneItem, index) => {
              return (<Fragment key={index}>
                {!oneItem.hidden &&
                <RactangleAlignChildrenLeft>
                  {this.generateInput(oneItem, testDetails, index)}
                  {this.showInfo(oneItem)}
                </RactangleAlignChildrenLeft>}
              </Fragment>)
            }, this)}

            <div className={style.buttons}>
              {this.props.processingAction && !this.props.serverError ? <Loader />
                : <RaisedButton label='Submit' onClick={this.whenSubmit}
                  primary
                  disabled={this.isThereErrorOnForm()}
                />}
              <RaisedButton label='Cancel' secondary onClick={this.returnAllTests} />
            </div>

            {this.props.serverError ? <ErrorDialog showMessage={this.props.serverError}
              closeDialog={this.closeViewErrorDialog} /> : null}
          </div>
        </div>

      );
    }

    generateInput = (oneItem, testDetails) => {
      switch (oneItem.type) {
      case inputTypes.CHECKBOX:
        return (
          <Checkbox className={style.TextFieldAndCheckBoxToolTip}
            style={{ width: oneItem.width }} key={oneItem.key}
            disabled={oneItem.disabled}
            errorText={this.state.errors[oneItem.name]}
            onCheck={oneItem.handleChange ? oneItem.handleChange.bind(this, oneItem.name) : undefined}
            label={oneItem.label}
            name={oneItem.name}
            value={false}
          />
        );
      case inputTypes.INPUT_LIST:
        return (
          <InputList
            title={oneItem.floatingLabelText}
            element={oneItem.element}
            id={oneItem.key}
            onChange={oneItem.handleChange ? oneItem.handleChange.bind(this, oneItem.name) : undefined}
            instance={this}
            elements={this.state[oneItem.key]}
          />
        )
      case inputTypes.TEXT_FIELD:
        return (
          <TextField
            className={style.TextFieldAndCheckBoxToolTip}
            style={{ width: oneItem.width }}
            id='standard-multiline-flexible'
            key={oneItem.key}
            value={oneItem.disabled ? testDetails && testDetails[oneItem.name] : this.showValue(this.state[oneItem.name], testDetails, oneItem[oneItem.key])}
            disabled={oneItem.disabled}
            errorText={this.state.errors[oneItem.name]}
            onChange={oneItem.handleChange ? oneItem.handleChange.bind(this, oneItem.name) : undefined}
            floatingLabelText={oneItem.floatingLabelText}
            name={oneItem.name}
            rows={2}
            rowsMax={4}
            multiLine
          />
        );
      default:
        return (
          <TextField
            className={style.TextFieldAndCheckBoxToolTip}
            style={{ width: oneItem.width }}
            key={oneItem.key}
            value={oneItem.disabled ? testDetails && testDetails[oneItem.name] : this.showValue(this.state[oneItem.name], testDetails, oneItem[oneItem.key])}
            disabled={oneItem.disabled}
            errorText={this.state.errors[oneItem.name]}
            onChange={oneItem.handleChange ? oneItem.handleChange.bind(this, oneItem.name) : undefined}
            floatingLabelText={oneItem.floatingLabelText}
            name={oneItem.name} />
        )
      }
    }

    whenSubmit = () => {
      console.log('state',this.state)
      let body = {
        test_id: this.props.data.id,
        arrival_rate: parseInt(this.state.arrival_rate),
        duration: parseInt(this.state.duration),
        ramp_to: this.state.ramp_to ? parseInt(this.state.ramp_to) : undefined,
        environment: this.state.environment,
        cron_expression: this.state.cron_expression,
        run_immediately: (this.state.run_immediately === undefined) ? false : this.state.run_immediately,
        emails: this.state.emails,
        webhooks: this.state.webhooks,
        notes: this.state.notes,
        parallelism: this.state.parallelism ? parseInt(this.state.parallelism) : undefined,
        max_virtual_users: this.state.max_virtual_users ? parseInt(this.state.max_virtual_users) : undefined
      };

      body = JSON.parse(JSON.stringify(body));
      this.props.createJob(body);
    };
}

function mapStateToProps (state) {
  return {
    processingAction: processingCreateJob(state),
    serverError: createJobFailure(state),
    createJobSuccess: createJobSuccess(state)
  }
}

const mapDispatchToProps = {
  clearErrorOnCreateJob: Actions.clearErrorOnCreateJob,
  createJob: Actions.createJob,
  clearSelectedJob: Actions.clearSelectedJob
};

export default connect(mapStateToProps, mapDispatchToProps)(Form);
