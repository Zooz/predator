import Page from "../components/Page";
import React, {useEffect, useState} from "react";
import WebhooksList from './components/WebhooksList';
import Button from "../components/Button";
import style from "./style.scss";
import {sortedWebhooksWithSpacer, webhookError, deleteWebhookSuccess, loading} from "./redux/selectors/webhooksSelector";
import * as Actions from "./redux/action";
import {connect} from "react-redux";
import ErrorDialog from "./components/ErrorDialog";
import Loader from "./components/Loader";
import Snackbar from "material-ui/Snackbar";


const DESCRIPTION = 'Here  you can configure webhooks';

const Webhhooks = ({setDeleteWebHookSuccess, deleteWebhookSuccess, loading, cleanErrors, webhookError, webhooks, getWebhooks}) => {
    const [showCreateWebhook, setShowCreateWebhook] = useState(false);

    useEffect(() => {
        getWebhooks();

    }, []);
    const onClose = () => {
        setShowCreateWebhook(false);
    };
    const handleSnackbarClose = () => {
        setDeleteWebHookSuccess(false);
    };
    const feedbackMsg = deleteWebhookSuccess ? 'webhook deleted successfully' : undefined;
    return (
        <Page title={'Webhooks'} description={DESCRIPTION}>
            <div style={{display: 'flex', flexDirection: 'column'}}>
                <Button style={{alignSelf:'center'}} disabled={showCreateWebhook} className={style['create-button']} onClick={() => {
                    setShowCreateWebhook(true);
                }}>Create Webhook</Button>
                {!showCreateWebhook && webhooks.length === 0 && loading && <Loader/>}
                <WebhooksList onClose={onClose} createMode={showCreateWebhook} webhooks={webhooks}/>
                {webhookError && <ErrorDialog closeDialog={cleanErrors} showMessage={webhookError}/>}
                {feedbackMsg && <Snackbar
                    open={!!feedbackMsg}
                    bodyStyle={{backgroundColor: '#2fbb67'}}
                    message={feedbackMsg}
                    autoHideDuration={4000}
                    onRequestClose={handleSnackbarClose}
                />}
            </div>
        </Page>

    )

};


function mapStateToProps(state) {
    return {
        loading: loading(state),
        webhooks: sortedWebhooksWithSpacer(state),
        webhookError: webhookError(state),
        deleteWebhookSuccess: deleteWebhookSuccess(state),
    }
}

const mapDispatchToProps = {
    getWebhooks: Actions.getWebhooks,
    cleanErrors: Actions.cleanErrors,
    setDeleteWebHookSuccess: Actions.deleteWebHookSuccess,
};

export default connect(mapStateToProps, mapDispatchToProps)(Webhhooks);
