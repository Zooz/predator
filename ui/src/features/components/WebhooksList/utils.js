export const createWebhookRequest = (webhook) => {
    return {
        name: webhook.name,
        url: webhook.url,
        events: Object.entries(webhook.events || {}).filter((entry) => entry[1] === true).map(entry => entry[0]),
        format_type: webhook.format_type
    }
};

export const buildStateFromWebhook = (webhook) => {

    return {
        name: webhook.name,
        id: webhook.id,
        url: webhook.url,
        events: buildEventsObjectFromArray(webhook.events),
        format_type: webhook.format_type
    }

};

function buildEventsObjectFromArray(eventsArr) {

    return eventsArr.reduce((acc, cur) => {
        acc[cur] = true;
        return acc;
    }, {})
}
