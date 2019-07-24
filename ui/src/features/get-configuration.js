import React from 'react';
import {connect} from 'react-redux';
import {
    config,
    errorOnGetConfig,
    processingGetConfig,
    processingUpdateConfig
} from './redux/selectors/configSelector';
import * as Actions from './redux/action';
import Loader from '../features/components/Loader';
import ConfigurationForm from './components/ConfigurationForm';
import Page from '../components/Page';
import Card from '../components/Card';
import style from './get-configuration.scss'
const errorMsgGetConfig = 'Error occurred while trying to get Predator configuration.';
class getConfiguration extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.props.getConfig();
    }

    componentWillUnmount() {
        this.props.getConfigFailure(undefined);
    }

    render() {
        const {config, errorOnGetConfig, processingGetConfig} = this.props;
        return (
            <Page title={'Configuration'} description={'ELI TODO'}>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'center'}}>
                    {errorOnGetConfig ? errorMsgGetConfig : null}
                    {processingGetConfig && <Loader/>}
                    {(config && !errorOnGetConfig && !processingGetConfig) &&
                    <Card className={style['card-wrapper']}>
                        <ConfigurationForm history={this.props.history} config={config}/>
                    </Card>}
                </div>
            </Page>

        )
    }
}

function mapStateToProps(state) {
    return {
        config: config(state),
        processingGetConfig: processingGetConfig(state),
        processingUpdateConfig: processingUpdateConfig(state),
        errorOnGetConfig: errorOnGetConfig(state)
    }
}

const mapDispatchToProps = {
    getConfig: Actions.getConfig,
    getConfigSuccess: Actions.getConfigSuccess,
    updateConfigFailure: Actions.updateConfigFailure,
    updateConfigSuccess: Actions.updateConfigSuccess,
    getConfigFailure: Actions.getConfigFailure,
};

export default connect(mapStateToProps, mapDispatchToProps)(getConfiguration);
