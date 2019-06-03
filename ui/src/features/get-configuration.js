import React from 'react';
import { connect } from 'react-redux';
import { config, errorOnGetConfig, errorOnUpdateConfig, processingGetConfig, processingUpdateConfig } from './redux/selectors/configSelector';
import * as Actions from './redux/action';
import Loader from '../features/components/Loader';
import Page from '../components/Page';
import ConfigurationForm from './components/ConfigurationForm';
import history from "../store/history";
const noDataMsg = 'There is no data to display.';
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
        return (this.props.processingGetConfig) ? <Loader /> : noDataMsg;
    }

    render () {
        return (
            <div>
                {this.props.config
                    ? <ConfigurationForm history={history} config={this.props.config} /> : this.loader()}
            </div>
        )
    }
}

function mapStateToProps (state) {
    return {
        config: config(state),
        processingGetConfig: processingGetConfig(state),
        processingUpdateConfig: processingUpdateConfig(state),
        errorOnGetConfig: errorOnGetConfig(state),
        errorOnUpdateConfig: errorOnUpdateConfig(state)
    }
}

const mapDispatchToProps = {
    getConfig: Actions.getConfig,
    getConfigSuccess: Actions.getConfigSuccess,
    getConfigFailure: Actions.getConfigFailure,
    updateConfigFailure: Actions.updateConfigFailure,
    updateConfigSuccess: Actions.updateConfigSuccess
};

export default connect(mapStateToProps, mapDispatchToProps)(getConfiguration);
