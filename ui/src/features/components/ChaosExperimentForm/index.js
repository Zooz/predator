import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import style from './style.scss';
import * as Actions from '../../redux/action';
import * as Selectors from '../../redux/selectors/chaosExperimentsSelector';
import Modal from '../Modal';
import Button from '../../../components/Button';
import MonacoEditor from '@uiw/react-monacoeditor';
import TitleInput from '../../../components/TitleInput';
import Input from '../../../components/Input';
import CustomDropdown from '../../../components/Dropdown/CustomDropdown';
import ErrorWrapper from '../../../components/ErrorWrapper';
import validateKubeObject from './validator';

const CHAOS_EXPERIMENT_KINDS = ['PodChaos', 'DNSChaos', 'AWSChaos', 'HTTPChaos', 'StressChaos']
const API_VERSION = 'chaos-mesh.org/v1alpha1'

export class ChaosExperimentForm extends React.Component {
  constructor (props) {
    console.log(props)
    debugger;
    super(props);
    if (props.chaosExperimentForEdit) {
      this.state = {
        validationErrorText: '',
        name: props.chaosExperimentForEdit.kubeObject.metadata.name,
        kind: props.chaosExperimentForEdit.kubeObject.kind,
        yaml: props.chaosExperimentForEdit.kubeObject
      }
    } else {
      this.state = {
        validationErrorText: '',
        name: '',
        kind: '',
        yaml: {
          metadata: {
            namespace: '',
            name: '',
            annotations: {}
          },
          spec: {
            duration: '0ms'
          }
        }
      };
    }
  }
  handleExperimentSubmit = () => {
    const { createChaosExperiment } = this.props;
    const chaosExperimentRequest = createChaosExperimentRequest(this.state)
    const validationError = validateKubeObject(chaosExperimentRequest.kubeObject)
    if (validationError) {
      this.setState({ validationErrorText: validationError })
    } else {
      createChaosExperiment(chaosExperimentRequest);
    }
  }

  componentDidUpdate (prevProps, prevState) {
    const { createChaosExperimentSuccess: createChaosExperimentSuccessBefore } = prevProps;
    const {
      createChaosExperimentSuccess,
      closeDialog
    } = this.props;

    if (createChaosExperimentSuccess && !createChaosExperimentSuccessBefore) {
      this.props.setCreateChaosExperimentSuccess(false);
      closeDialog();
    }
  }

  render () {
    const { closeDialog } = this.props;
    const {
      name,
      kind
    } = this.state;
    return (
      <Modal onExit={closeDialog}>
        <h1>Create Chaos Experiment</h1>
        <div className={style['top']}>
          <div className={style['top-inputs']}>
            {/* left */}
            <div className={style['input-container']}>
              <TitleInput
                className={style['inputContainer__titleInput']}
                title={'Experiment Name'}>
                <Input value={name} onChange={this.handleNameChange} />
              </TitleInput>
            </div>
            <div className={style['input-container']}>
              <TitleInput
                className={style['inputContainer__titleInput']}
                title={'Api Version'}>
                <Input value={API_VERSION} disabled />
              </TitleInput>
            </div>
            <div className={style['input-container']}>
              <TitleInput
                className={style['inputContainer__titleInput']}
                title={'kind'}>
                <CustomDropdown
                  list={CHAOS_EXPERIMENT_KINDS}
                  value={kind}
                  onChange={(value) => {
                    this.handleKindChange(value);
                  }}
                  placeHolder={'Kind'}
                />
              </TitleInput>
            </div>
          </div>
        </div>
        {/* bottom */}
        {this.generateJavascriptEditor()}
        {this.generateBottomBar()}
      </Modal>
    );
  }

    generateBottomBar = () => {
      const {
        isLoading,
        closeDialog
      } = this.props;

      return (
        <div className={style['buttons-container']}>
          <div className={style['form-button']}>
            <Button inverted onClick={closeDialog}>Cancel</Button>
            <Button spinner={isLoading} hover disabled={!this.state.name || !this.state.kind}
              onClick={
                this.handleExperimentSubmit
              }>Submit</Button>
          </div>
        </div>
      );
    };

  onInputCodeChange = (code) => {
    this.setState({ validationErrorText: '' })
    const isValidCode = testJSON(code);
    if (!isValidCode) return; // Exit early if code is not valid JSON

    const parsedCode = JSON.parse(code);
    this.setState((prevState) => {
      const parsedName = _.get(parsedCode, 'metadata.name', prevState.name);
      const parsedKind = _.get(parsedCode, 'kind', prevState.kind);

      if (_.isEqual(prevState.yaml, parsedCode)) return null; // Only update if the value is different

      return {
        yaml: parsedCode,
        name: parsedName,
        kind: parsedKind
      };
    });
  };

    handleNameChange = (evt) => {
      const newName = evt.target.value;
      this.setState((prevState) => {
        if (prevState.name === newName) return null;
        return {
          name: newName,
          yaml: {
            ...prevState.yaml,
            metadata: {
              ...prevState.yaml.metadata,
              name: newName
            }
          }
        };
      });
    };

    handleKindChange = (value) => {
      const newKind = value;
      this.setState((prevState) => {
        if (prevState.kind === newKind) return null;
        return {
          ...prevState,
          kind: newKind
        };
      });
    };

    generateJavascriptEditor = () => {
      const options = {
        selectOnLineNumbers: true,
        roundedSelection: false,
        readOnly: false,
        cursorStyle: 'line',
        automaticLayout: false,
        theme: 'vs'
      };
      return (
        <ErrorWrapper errorText={this.state.validationErrorText}>
          <div className={style['bottom']}>
            {/* bottom */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1
            }}>
              <MonacoEditor
                language='json'
                value={JSON.stringify(this.state.yaml, null, '\t')}
                options={options}
                height='500px'
                width='100%'
                onChange={(code) => {
                  this.onInputCodeChange(code);
                }}
                scrollbar={{
                // Subtle shadows to the left & top. Defaults to true.
                  useShadows: false,
                  // Render vertical arrows. Defaults to false.
                  verticalHasArrows: true,
                  // Render horizontal arrows. Defaults to false.
                  horizontalHasArrows: true,
                  // Render vertical scrollbar.
                  // Accepted values: 'auto', 'visible', 'hidden'.
                  // Defaults to 'auto'
                  vertical: 'visible',
                  // Render horizontal scrollbar.
                  // Accepted values: 'auto', 'visible', 'hidden'.
                  // Defaults to 'auto'
                  horizontal: 'visible',
                  verticalScrollbarSize: 17,
                  horizontalScrollbarSize: 17,
                  arrowSize: 30
                }}
              />
            </div>
          </div>
        </ErrorWrapper>
      );
    };
}

function mapStateToProps (state) {
  return {
    isLoading: Selectors.chaosExperimentsLoading(state),
    createChaosExperimentSuccess: Selectors.createChaosExperimentSuccess(state),
    chaosExperimentsList: Selectors.chaosExperimentsList(state),
    chaosExperimentsError: Selectors.chaosExperimentFailure(state)
  };
}

function createChaosExperimentRequest (data) {
  const {
    name,
    yaml
  } = data;
  return {
    name,
    kubeObject: {
      kind: data.kind,
      apiVersion: API_VERSION,
      ...yaml
    }
  };
}

function testJSON (text) {
  if (typeof text !== 'string') {
    return false;
  }
  try {
    JSON.parse(text);
    return true;
  } catch (error) {
    return false;
  }
}

const mapDispatchToProps = {
  createChaosExperiment: Actions.createChaosExperiment,
  setCreateChaosExperimentSuccess: Actions.createChaosExperimentSuccess
};
export default connect(mapStateToProps, mapDispatchToProps)(ChaosExperimentForm);
