import React, { Fragment } from 'react';
import style from './style.scss';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import Checkbox from 'material-ui/Checkbox';
import { connect } from 'react-redux';
import { processingCreateJob, createJobSuccess, createJobFailure } from '../../instance/redux/selectors/jobsSelector';
import * as Actions from '../../instance/redux/action';
import Loader from '../Loader';
import InputList from '../InputList';
import ErrorDialog from '../ErrorDialog';
import classNames from 'classnames';
import TooltipWrapper from '../../../../components/TooltipWrapper';
import RactangleAlignChildrenLeft from '../../../../components/RectangleAlign/RectangleAlignChildrenLeft';
import { validate } from './validator';
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
        floatingLabelText: 'Duration (seconds)',
        info: 'The duration of the test in seconds.'
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
        info: 'Schedule a one time job, which will run the test now.',
        type: inputTypes.CHECKBOX
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
      const newState = Object.assign({}, this.state, { [name]: evt.target.checked });
      newState.errors = validate(newState);
      this.setState(newState);
    };

    onChangeFreeText = (name, evt) => {
      const newState = Object.assign({}, this.state, { [name]: evt.target.value });
      newState.errors = validate(newState);
      this.setState(newState);
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

    showValue (value, testDetails, field) {
      let testField = (testDetails ? testDetails[field] : undefined);
      return this.props.serverError ? testField : value || '';
    }

    isThereErrorOnForm () {
      let state = this.state;

      return (Object.values(state.errors).find((oneError) => {
        return oneError !== undefined;
      }));
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
                  {this.generateInput(oneItem, testDetails)}
                  {this.showInfo(oneItem)}
                </RactangleAlignChildrenLeft>}
              </Fragment>);
            }, this)}

            <div className={style.buttons}>
              {this.props.processingAction && !this.props.serverError ? <Loader />
                : <RaisedButton label='Submit' onClick={this.whenSubmit}
                  primary
                  disabled={!!this.isThereErrorOnForm()}
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
            style={{ width: oneItem.width, marginTop: '10px' }} key={oneItem.key}
            disabled={oneItem.disabled}
            errorText={this.state.errors[oneItem.name]}
            onCheck={(evt) => { this.handleChangeForCheckBox(oneItem.name, evt) }}
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
            onChange={(evt) => this.handleInputListAdd(oneItem.name, evt)}
            elements={this.state[oneItem.name]}
          />
        );
      case inputTypes.TEXT_FIELD:
        return (
          <TextField
            className={style.TextFieldAndCheckBoxToolTip}
            style={{ width: oneItem.width }}
            id='standard-multiline-flexible'
            key={oneItem.key}
            value={oneItem.disabled ? testDetails && testDetails[oneItem.name] : this.showValue(this.state[oneItem.name], testDetails, oneItem.name)}
            disabled={oneItem.disabled}
            errorText={this.state.errors[oneItem.name]}
            onChange={(evt) => this.onChangeFreeText(oneItem.name, evt)}
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
            value={oneItem.disabled ? testDetails && testDetails[oneItem.name] : this.showValue(this.state[oneItem.name], testDetails, oneItem.name)}
            disabled={oneItem.disabled}
            errorText={this.state.errors[oneItem.name]}
            onChange={(evt) => this.onChangeFreeText(oneItem.name, evt)}
            floatingLabelText={oneItem.floatingLabelText}
            name={oneItem.name} />
        );
      }
    }

    whenSubmit = () => {
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
  };
}

const mapDispatchToProps = {
  clearErrorOnCreateJob: Actions.clearErrorOnCreateJob,
  createJob: Actions.createJob,
  clearSelectedJob: Actions.clearSelectedJob
};

export default connect(mapStateToProps, mapDispatchToProps)(Form);
