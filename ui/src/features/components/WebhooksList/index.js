import React from 'react';
import CollapsibleWebhook from './CollapsibleWebhook';

const WebhooksList = ({webhooks}) => {


    return (
        <div style={{flex: 1, display: 'flex', flexDirection:'column', alignItems: 'center'}}>
            {
                webhooks.map((webhook) => {
                    return (
                        <div style={{flex: 1, maxWidth: '746px'}}>
                            <CollapsibleWebhook webhook={webhook}/>
                        </div>
                    )
                })
            }

        </div>
    )


};

export default WebhooksList;
