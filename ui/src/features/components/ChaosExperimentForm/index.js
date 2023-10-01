import React from 'react';
import { connect } from 'react-redux';
import style from './style.scss';
import * as Actions from '../../redux/action';
import * as Selectors from '../../redux/selectors/chaosExperimentsSelector';
import Modal from '../Modal';
import Button from '../../../components/Button';
import MonacoEditor from '@uiw/react-monacoeditor';
import TitleInput from '../../../components/TitleInput';
import Input from '../../../components/Input';
import ErrorWrapper from '../../../components/ErrorWrapper';
import validateKubeObject, { CHAOS_EXPERIMENT_KINDS, API_VERSION } from './validator';
import InfoToolTip from '../InfoToolTip';

export class ChaosExperimentForm extends React.Component {
  constructor (props) {
    super(props);
    if (props.chaosExperimentForEdit) {
      this.state = {
        validationErrorText: '',
        // name: props.chaosExperimentForEdit.kubeObject.metadata.name,
        // kind: props.chaosExperimentForEdit.kubeObject.kind,
        yaml: JSON.stringify(props.chaosExperimentForEdit.kubeObject, null, '\t')
      }
    } else {
      this.state = {
        validationErrorText: '',
        yaml: `{
  "apiVersion": "${API_VERSION}",
  "kind": "${CHAOS_EXPERIMENT_KINDS[0]}",
  "metadata": {
    "name": "",
    "namespace": "",
    "annotations": {}
  },
  "spec": {
    "duration": "",
    "action": ""
  }
}`
        // yaml: {
        //   version: API_VERSION,
        //   kind: CHAOS_EXPERIMENT_KINDS[0],
        //   metadata: {
        //     namespace: '',
        //     name: '',
        //     annotations: {}
        //   },
        //   spec: {
        //     duration: '0ms'
        //   }
        // }
      };
    }
  }
  handleExperimentSubmit = () => {
    const { createChaosExperiment } = this.props;
    const chaosExperimentRequest = createChaosExperimentRequest(JSON.parse(this.state.yaml))
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
    const { closeDialog, chaosExperimentForEdit } = this.props;
    return (
      <Modal onExit={closeDialog}>
        <h1>Create Chaos Experiment</h1>
        <div className={style['top']}>
          {!chaosExperimentForEdit && (
            <div className={style['top-inputs']}>
              <div className={style['input-container']}>
                <TitleInput
                  className={style['inputContainer__titleInput']}
                  title={'Api Version'} rightComponent={<InfoToolTip data={{
                    key: 'star-info',
                    info: <span>Please Use Chaos Mesh documentation to build correct kubernetes object <a href='https://chaos-mesh.org/doc<'>docs</a></span> }} />}>
                  <Input value={API_VERSION} disabled />
                </TitleInput>
              </div>
            </div>
          )}
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
            <Button spinner={isLoading} hover disabled={this.state.validationErrorText.length > 0}
              onClick={
                this.handleExperimentSubmit
              }>Submit</Button>
          </div>
        </div>
      );
    };

  onInputCodeChange = (code) => {
    const isValidCode = testJSON(code);
    debugger;
    if (!isValidCode) {
      this.setState({ validationErrorText: 'Invalid JSON format', yaml: code })
    } else {
      this.setState({ validationErrorText: '', yaml: code })
    }
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
                value={this.state.yaml}
                options={options}
                height='500px'
                width='100%'
                onChange={this.onInputCodeChange}
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

function createChaosExperimentRequest (code) {
  return {
    name: code.metadata.name,
    kubeObject: {
      ...code
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
