const app = require('../../src/app');
module.exports = {
    getCreateTestApp
};
process.env.ENABLE_CHAOS_MESH = true;

let testApp;
let shouldInitiate = true;

async function getCreateTestApp() {
    if (shouldInitiate) {
        shouldInitiate = false;
        testApp = await app();
    }

    return testApp;
}
