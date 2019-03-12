import React, { Fragment } from 'react';
import style from './style.scss';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import Checkbox from 'material-ui/Checkbox';
import { connect } from 'react-redux';
import {processingUpdateConfig, errorOnUpdateConfig, config} from '../../instance/redux/selectors/configSelector';
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
    this.state = {};
    this.ConfigForm = {};
    this.FormList = [];

    Object.keys(this.props.parsedConfig).forEach((configTitle) => {
      this.ConfigForm[configTitle] = [];
      this.props.parsedConfig[configTitle].forEach((singleConfigValue) => {
        this.ConfigForm[configTitle].push({
          width: 350,
          name: singleConfigValue.name,
          key: singleConfigValue.name,
          value: this.props.config[singleConfigValue.name] || singleConfigValue.value,
          floatingLabelText: singleConfigValue.name,
          info: singleConfigValue.info
        });

        this.state[singleConfigValue.name] = this.props.config[singleConfigValue.name] || singleConfigValue.value
      });
    });

    this.state['errors'] = {
          name: undefined,
          retries: undefined,
          uris: undefined,
          upstream_url: undefined,
          upstream_send_timeout: undefined,
          upstream_read_timeout: undefined,
          upstream_connect_timeout: undefined
    };
  }

    handleChangeForCheckBox = (name, evt) => {
      const newState = Object.assign({}, this.state, { [name]: evt.target.checked });
      // newState.errors = validate(newState);
      this.setState(newState);
    };

    onChangeFreeText = (name, evt) => {
      const newState = Object.assign({}, this.state, { [name]: evt.target.value });
      // newState.errors = validate(newState);
      this.setState(newState);
    };

    handleInputListAdd = (target, newElement) => {
      this.setState({
        [target]: [...this.state[target], newElement]
      });
    };

    closeViewErrorDialog = () => {
      this.props.clearErrorOnUpdateConfig();
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

  static getDerivedStateFromProps (nextProps, prevState) {

    const config = nextProps.config || {};
    let newState = {};

    Object.keys(prevState).forEach((key) => {
      if (prevState[key] !== config[key]) {
        newState[key] = prevState[key];
      } else {
        newState[key] = config[key];
      }
    });

    return newState;
  };


  render () {
      const testDetails = this.props.data;
      return (
        <div>
          <div className={style.form}>
            {Object.keys(this.ConfigForm).map((title) => {
              return this.generateSectionInput(title, testDetails);
            })}

            <div className={style.buttons}>
              {this.props.processingAction && !this.props.serverError ? <Loader />
                : <RaisedButton label='Submit' onClick={this.whenSubmit}
                  primary
                  disabled={!!this.isThereErrorOnForm()}
                />}
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
          <div>
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
          </div>

        );
      }
    };

    generateSectionInput = (title, testDetails) => {
      return (
          <fragment key={title}>
            <h2>{title}</h2>
              {this.ConfigForm[title].map((oneItem, index) => {
              return (
                <Fragment key={index}>
                {!oneItem.hidden &&
                <RactangleAlignChildrenLeft>
                  {this.generateInput(oneItem, testDetails)}
                  {this.showInfo(oneItem)}
                </RactangleAlignChildrenLeft>}
                </Fragment>
              );
            }, this)}
          </fragment>
    )
    };

    whenSubmit = () => {
      let body = {};

      Object.keys(this.state).forEach((configKey) => {
        if (configKey !== 'errors' && this.state[configKey] !== '') {
          if (this.props.configDataMap[configKey] && this.props.configDataMap[configKey].type === 'int') {
            body[configKey] = parseInt(this.state[configKey]);
          } else {
            body[configKey] = this.state[configKey];
          }
        }
      });

      body = JSON.parse(JSON.stringify(body));

      this.props.updateConfig(body);
      this.props.getConfig();
      this.props.history.push('/configuration');
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
  getConfig: Actions.getConfig
};

export default connect(mapStateToProps, mapDispatchToProps)(Form);
