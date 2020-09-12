import Page from "../components/Page";
import React, {useEffect, useState} from "react";
import WebhooksList from './components/WebhooksList';
import Button from "../components/Button";
import style from "./style.scss";
import {webhooks, webhookError, loading} from "./redux/selectors/webhooksSelector";
import {createJobSuccess} from "./redux/selectors/jobsSelector";
import * as Actions from "./redux/action";
import {connect} from "react-redux";
import CollapsibleWebhook from './components/WebhooksList/CollapsibleWebhook';
import ErrorDialog from "./components/ErrorDialog";
import Loader from "./components/Loader";

/*TODO
* feedback message
* */

const DESCRIPTION = 'Here  you can configure webhooks';

const Webhhooks = ({loading, cleanErrors, webhookError, webhooks, getWebhooks}) => {
    const [showCreateWebhook, setShowCreateWebhook] = useState(false);

    useEffect(() => {
        getWebhooks();

    }, []);
    const onClose = () => {
        setShowCreateWebhook(false);
    }
    return (
        <Page title={'Webhooks'} description={DESCRIPTION}>
            <Button disabled={showCreateWebhook} className={style['create-button']} onClick={() => {
                setShowCreateWebhook(true);
            }}>Create Webhook</Button>
            {!showCreateWebhook && loading && <Loader/>}
            <WebhooksList onClose={onClose} createMode={showCreateWebhook} webhooks={webhooks}/>
            {webhookError && <ErrorDialog closeDialog={cleanErrors} showMessage={webhookError}/>}

        </Page>

    )

};


function mapStateToProps(state) {
    return {
        loading: loading(state),
        webhooks: webhooks(state),
        webhookError: webhookError(state),
    }
}

const mapDispatchToProps = {
    getWebhooks: Actions.getWebhooks,
    cleanErrors: Actions.cleanErrors,
};

export default connect(mapStateToProps, mapDispatchToProps)(Webhhooks);
