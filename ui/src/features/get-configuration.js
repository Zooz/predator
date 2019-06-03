import React from 'react';
import { connect } from 'react-redux';
import { config, errorOnGetConfig, errorOnUpdateConfig, processingGetConfig, processingUpdateConfig } from './redux/selectors/configSelector';
import * as Actions from './redux/action';
import Loader from '../features/components/Loader';
import ConfigurationForm from './components/ConfigurationForm';
import history from "../store/history";
import ErrorDialog from "./components/ErrorDialog";
const errorMsgGetConfig = 'Error occurred while trying to get Predator configuration.';

class getConfiguration extends React.Component {
    constructor (props) {
        super(props);
    }

    componentDidMount () {
        this.loadPageData();
    }

    loadPageData = () => {
        this.props.getConfig();
    };

    componentWillUnmount () {

    }

    loader () {
        return (this.props.processingGetConfig) ? <Loader /> : errorMsgGetConfig;
    }

    render () {
        const {serverError, clearErrorOnUpdateConfig, config} = this.props;
        return (
            <div>
                {config
                    ? <ConfigurationForm history={history} config={config} /> : this.loader()}

                { serverError &&
                    <ErrorDialog closeDialog={() => {clearErrorOnUpdateConfig()}} showMessage={serverError}/>
                }
            </div>
        )
    }
}

function mapStateToProps (state) {
    return {
        config: config(state),
        processingGetConfig: processingGetConfig(state),
        processingUpdateConfig: processingUpdateConfig(state),
        serverError: errorOnUpdateConfig(state),
        errorOnGetConfig: errorOnGetConfig(state)
    }
}

const mapDispatchToProps = {
    getConfig: Actions.getConfig,
    getConfigSuccess: Actions.getConfigSuccess,
    getConfigFailure: Actions.getConfigFailure,
    updateConfigFailure: Actions.updateConfigFailure,
    updateConfigSuccess: Actions.updateConfigSuccess,
    clearErrorOnUpdateConfig: Actions.clearUpdateConfigError
};

export default connect(mapStateToProps, mapDispatchToProps)(getConfiguration);
