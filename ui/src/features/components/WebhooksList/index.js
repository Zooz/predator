import React from 'react';
import CollapsibleWebhook from './CollapsibleWebhook';

const WebhooksList = ({webhooks, onClose, createMode}) => {


    return (
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>

            {
                (createMode && <CollapsibleWebhook onClose={onClose} createMode={createMode}/>)
                ||
                webhooks.map((webhook, index) => {
                    return (
                        <CollapsibleWebhook key={index} webhook={webhook}/>
                    )
                })
            }

        </div>
    )
};


export default WebhooksList;
