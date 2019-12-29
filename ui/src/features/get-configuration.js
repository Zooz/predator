import React from 'react';
import {connect} from 'react-redux';
import {
    config,
    errorOnGetConfig,
    processingGetConfig,
    processingUpdateConfig,
    cleanFinishedContainersSuccess,
    cleanFinishedContainersFailure
} from './redux/selectors/configSelector';
import * as Actions from './redux/action';
import Loader from '../features/components/Loader';
import ConfigurationForm from './components/ConfigurationForm';
import Page from '../components/Page';
import Card from '../components/Card';
import style from './get-configuration.scss'
import TitleInput from "../components/TitleInput";
import classnames from 'classnames';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import ErrorDialog from '../features/components/ErrorDialog';

import {
    faTrashAlt,
} from '@fortawesome/free-solid-svg-icons'
import Snackbar from "material-ui/Snackbar";

const errorMsgGetConfig = 'Error occurred while trying to get Predator configuration.';
const CardWithTitle = ({children, title}) => {
    return (
        <div style={{display: 'flex', flexDirection: 'column', width: '50%'}}>
            <h1 color={'#555555'}>{title}</h1>
            <Card className={style['card-wrapper']}>
                {children}
            </Card>
        </div>

    )
};

class getConfiguration extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.props.getConfig();
    }

    componentWillUnmount() {
    }

    render() {
        const {config, errorOnGetConfig, processingGetConfig, cleanFinishedContainersSuccess, cleanFinishedContainersFailure} = this.props;
       const currentError = cleanFinishedContainersFailure || errorOnGetConfig;
        return (
            <Page title={'Settings'} description={'Customize Predator behavior'}>
                <div>
                    {errorOnGetConfig ? errorMsgGetConfig : null}
                    {processingGetConfig && <Loader/>}
                    {(config && !errorOnGetConfig && !processingGetConfig) &&
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                        <CardWithTitle title={'Configuration'}>
                            <ConfigurationForm history={this.props.history} config={config}/>
                        </CardWithTitle>
                        <CardWithTitle title={'Housekeeping'}>
                            <div className={style['configuration-item-wrapper']}>
                                <TitleInput title={'Clean up finished containers'}/>
                                <FontAwesomeIcon
                                    className={classnames(style['icon'], {
                                        [style['action-style']]: true,
                                        [style['disabled-button']]: false
                                    })}
                                    onClick={this.props.cleanFinishedContainers} icon={faTrashAlt}/>
                            </div>
                        </CardWithTitle>
                    </div>
                    }
                </div>
                {cleanFinishedContainersSuccess && <Snackbar
                    open={cleanFinishedContainersSuccess}
                    bodyStyle={{backgroundColor: '#2fbb67'}}
                    message={`${cleanFinishedContainersSuccess.deleted} containers were deleted`}
                    autoHideDuration={4000}
                    // onRequestClose={this.handleSnackbarClose}
                />}

                {currentError&&
                <ErrorDialog closeDialog={() => {
                    this.props.setCleanFinishedContainersFailure(undefined);
                    this.props.getConfigFailure(undefined);
                }} showMessage={currentError.message}/>}

            </Page>
        )
    }
}

function mapStateToProps(state) {
    return {
        config: config(state),
        processingGetConfig: processingGetConfig(state),
        processingUpdateConfig: processingUpdateConfig(state),
        errorOnGetConfig: errorOnGetConfig(state),
        cleanFinishedContainersSuccess: cleanFinishedContainersSuccess(state),
        cleanFinishedContainersFailure: cleanFinishedContainersFailure(state)
    }
}

const mapDispatchToProps = {
    getConfig: Actions.getConfig,
    getConfigSuccess: Actions.getConfigSuccess,
    updateConfigFailure: Actions.updateConfigFailure,
    updateConfigSuccess: Actions.updateConfigSuccess,
    getConfigFailure: Actions.getConfigFailure,
    cleanFinishedContainers: Actions.cleanFinishedContainers,
    setCleanFinishedContainersFailure: Actions.cleanFinishedContainersFailure

};

export default connect(mapStateToProps, mapDispatchToProps)(getConfiguration);
