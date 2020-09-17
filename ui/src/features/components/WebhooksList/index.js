import React from 'react';
import CollapsibleWebhook from './CollapsibleWebhook';

const WebhooksList = ({webhooks, onClose, createMode}) => {


    return (
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>

            {
                (createMode && <CollapsibleWebhook onClose={onClose} createMode={createMode}/>)
                ||
                webhooks.map((webhook, index) => {
                    if (typeof webhook === 'string' && webhook === 'SPACER') {
                        return (<div style={{
                            width: '100%', borderStyle: 'dashed',
                            marginBottom: '8px',
                            borderColor: '#79c2db',
                            borderWidth: '1px'

                        }}/>)
                    }
                    return (
                        <CollapsibleWebhook key={`${webhook.id}_${index}`} webhook={webhook}/>
                    )
                })
            }

        </div>
    )
};


export default WebhooksList;
