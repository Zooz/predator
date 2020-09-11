import React from 'react';
import CollapsibleItem from '../../../components/CollapsibleItem/CollapsibleItem';
import WebhookForm from './WebhookForm';
import {buildStateFromWebhook, createWebhookRequest} from './utils'
import {webhooks, loading, webhookSuccess} from "../../redux/selectors/webhooksSelector";
import * as Actions from "../../redux/action";
import {connect} from "react-redux";

const Section = CollapsibleItem.Section;


export class CollapsibleWebhook extends React.Component {
    constructor(props) {
        super(props);
        if (props.webhook) {
            this.state = {webhook: buildStateFromWebhook(props.webhook)}
        } else {
            this.state = {
                webhook: {
                    events: {},
                    format_type: 'slack'
                }
            }
        }
        this.state.expanded = props.createMode || false;
    }

    onChangeWebhook = (webhook) => {
        this.setState({webhook});
    };

    onSubmit = () => {
        const {createMode} = this.props;
        const {webhook} = this.state;
        if (createMode) {
            this.props.createWebhook(createWebhookRequest(webhook));
        } else {
            this.props.editWebhook(createWebhookRequest(webhook), webhook.id);
            this.setState({expanded: false});
        }
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.webhookSuccess === true && prevProps.webhookSuccess === false) {
            this.props.setWebhookSuccess(false);
            this.props.onClose();
        }
    }

    render() {

        const sections = createMode ? undefined : [
            <Section key={1} onClick={(evt) => {
                evt.stopPropagation();
                this.props.deleteWebhook(this.state.webhook.id)
            }} icon='fa-trash' tooltip='Delete webhook' borderLeft/>,

        ]
        const {expanded} = this.state;
        const {createMode} = this.props;
        return (
            <div style={{width: '756px'}}>
                <CollapsibleItem
                    onClick={(evt) => {
                        !createMode && this.setState({expanded: !this.state.expanded})
                    }}
                    editable={true}
                    expanded={expanded}
                    toggleable={!createMode}
                    type={createMode ? CollapsibleItem.TYPES.DEFAULT : CollapsibleItem.TYPES.CLICKER}
                    disabled={false}
                    icon={this.generateIcon()}
                    title={this.generateTitle()}
                    body={this.generateBody()}
                    sections={sections}
                />
            </div>

        )

    }

    generateIcon = () => {
        return 'fa-slack'
    };

    generateTitle = () => {
        const {webhook} = this.state;
        return <div style={{
            textOverflow: 'ellipsis',
            maxWidth: '600px',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
        }}>{`${webhook.name || ''} ${webhook.url || ''}`}</div>
    };


    generateBody = () => {
        return (
            <WebhookForm onCancel={this.props.onClose} loading={this.props.loading} onSubmit={this.onSubmit}
                         onChangeWebhook={this.onChangeWebhook} webhook={this.state.webhook}/>
        )
    }

}


function mapStateToProps(state) {
    return {
        loading: loading(state),
        webhookSuccess: webhookSuccess(state),
    }
}

const mapDispatchToProps = {
    createWebhook: Actions.createWebhook,
    editWebhook: Actions.editWebhook,
    deleteWebhook: Actions.deleteWebHook,
    setWebhookSuccess: Actions.createWebHookSuccess,
};

export default connect(mapStateToProps, mapDispatchToProps)(CollapsibleWebhook);
