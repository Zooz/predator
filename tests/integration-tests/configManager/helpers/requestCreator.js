const request = require('supertest');
const uri = '/v1/config';
let testApp;

module.exports = {
    init,
    updateConfig,
    deleteConfig,
    getConfig
};

async function init() {
    const appInitUtils = require('../../testUtils');
    testApp = await appInitUtils.getCreateTestApp();
}

function updateConfig(body) {
    return request(testApp).put(uri)
        .send(body)
        .expect(function (res) {
            console.log(res.body);
            return res;
        });
}

function getConfig() {
    return request(testApp).get(uri)
        .expect(function (res) {
            console.log(res.body);
            return res;
        });
}

function deleteConfig(key) {
    return request(testApp).delete(uri + '/' + key)
        .send()
        .set({ 'Content-Type': 'application/json' });
}
