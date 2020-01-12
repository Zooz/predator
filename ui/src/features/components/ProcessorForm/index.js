import React from 'react';
import TextField from 'material-ui/TextField';
import style from './style.scss';
import * as Actions from '../../redux/action';
import * as Selectors from '../../redux/selectors/processorsSelector';
import * as ProcessorsSelector from '../../redux/selectors/processorsSelector';
import {connect} from 'react-redux';
import Modal from '../Modal';
import {createProcessorRequest, createStateForEditTest} from './utils';
import Button from '../Button';
import ErrorDialog from '../ErrorDialog';
import MonacoEditor from '@uiw/react-monacoeditor';

export class ProcessorForm extends React.Component {
    constructor(props) {
        super(props);

        if (props.data) {
            this.state = createStateForEditTest(props.data);
            this.state.editMode = true;
        } else {
            this.state = {
                name: '',
                description: '',
                javascript: 'const x=100;'
            }
        }
    }

    postProcessor = () => {
        const {editMode} = this.state;
        const {createProcessor, editProcessor} = this.props;
        if (editMode) {
            editProcessor(this.state.id, createProcessorRequest(this.state));
        } else {
            createProcessor(createProcessorRequest(this.state));
        }
    };
    onCloseErrorDialog = () => {
        const {cleanAllErrors} = this.props;
        cleanAllErrors();
    };

    componentDidUpdate(prevProps, prevState) {
        const {createProcessorSuccess: createProcessorSuccessBefore, editProcessorSuccess: editProcessorSuccessBefore} = prevProps;
        const {createProcessorSuccess, editProcessorSuccess, closeDialog} = this.props;

        if (createProcessorSuccess && !createProcessorSuccessBefore) {
            this.props.setCreateProcessorSuccess(false);
            closeDialog();
        } else if (editProcessorSuccess && !editProcessorSuccessBefore) {
            this.props.setEditProcessorSuccess(false);
            closeDialog();
        }
    }


    render() {
        const {processorsError, closeDialog} = this.props;
        const {name, description} = this.state;
        return (
            <Modal onExit={closeDialog}>
                <h1>Create Processor</h1>
                <div className={style['top']}>
                    <div className={style['top-inputs']}>
                        {/* left */}
                        <div className={style['input-container']}>
                            Name:<TextField value={name} onChange={(event, value) => {
                            this.setState({name: value})
                        }} hintText={'Processor name'}/>
                        </div>
                        <div className={style['input-container']}>
                            Description:<TextField value={description} onChange={(event, value) => {
                            this.setState({description: value})
                        }} hintText={'Description'}/>
                        </div>
                    </div>
                </div>
                {/* bottom */}
                {this.generateJavascriptEditor()}
                {this.generateBottomBar()}
                {processorsError && <ErrorDialog closeDialog={this.onCloseErrorDialog} showMessage={processorsError}/>}
            </Modal>
        )
    }

    generateBottomBar = () => {
        const {isLoading, closeDialog} = this.props;

        return (<div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '340px'}}>
                <Button label={'CANCEL'} onClick={closeDialog}/>
                <Button isLoading={isLoading} onClick={this.postProcessor} label={'SAVE'}/>
            </div>
        </div>)
    };

    onInputCodeChange = (code) => {
        this.setState({javascript: code});
    };
    generateJavascriptEditor = () => {
        const options = {
                selectOnLineNumbers: true,
                roundedSelection: false,
                readOnly: false,
                cursorStyle: 'line',
                automaticLayout: false,
                theme: 'vs-dark'
            }
        ;
        const {javascript} = this.state;
        return (
            <div className={style['bottom']}>
                {/* bottom */}
                <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                    <MonacoEditor
                        language="javascript"
                        value={javascript}
                        options={options}
                        height="500px"
                        width="100%"
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
                            arrowSize: 30,
                        }}
                    />

                </div>
            </div>
        )
    };
}

function mapStateToProps(state) {
    return {
        isLoading: Selectors.processorsLoading(state),
        createProcessorSuccess: Selectors.createProcessorSuccess(state),
        processorsList: ProcessorsSelector.processorsList(state),
        processorsLoading: ProcessorsSelector.processorsLoading(state),
        processorsError: ProcessorsSelector.processorFailure(state),
        editProcessorSuccess: ProcessorsSelector.editProcessorSuccess(state),
    }
}

const mapDispatchToProps = {
    createProcessor: Actions.createProcessor,
    editProcessor: Actions.editProcessor,
    cleanAllErrors: Actions.cleanAllErrors,
    setCreateProcessorSuccess: Actions.createProcessorSuccess,
    setEditProcessorSuccess: Actions.editProcessorSuccess
};
export default connect(mapStateToProps, mapDispatchToProps)(ProcessorForm);
