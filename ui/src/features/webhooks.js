import Page from "../components/Page";
import React from "react";
import WebhooksList from './components/WebhooksList';
import Button from "../components/Button";
import style from "./style.scss";


const DESCRIPTION = 'Here  you can configure webhooks';
const data = [
    {
        "name": "mickeys webhook",
        "url": "https://hooks.slack.com/services/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",
        "events": [
            "started",
            "api_failure",
            "aborted",
            "failed",
            "finished",
            "benchmark_passed",
            "benchmark_failed"
        ],
        "format_type": "slack"
    },
    {
        "name": "mickeys webhook",
        "url": "https://hooks.slack.com/services/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",
        "events": [
            "started",
            "api_failure",
            "aborted",
            "failed",
            "finished",
            "benchmark_passed",
            "benchmark_failed"
        ],
        "format_type": "slack"
    }
];

const Webhhooks = () => {


    return (
        <Page title={'Webhooks'} description={DESCRIPTION}>
            <Button className={style['create-button']} onClick={() => {
                this.setState({
                    createProcessor: true
                });
            }}>Create Webhook</Button>
            <WebhooksList webhooks={data}/>

        </Page>

    )

};


export default Webhhooks;
