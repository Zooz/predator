function getContextIdFromHeaders(headers) {
    return headers['x-context-id'] || null;
}

function getContextIdFromQuery(query) {
    return query.context_id || null;
}

module.exports.getContextIdFromHeaders = getContextIdFromHeaders;
module.exports.getContextIdFromQuery = getContextIdFromQuery;
