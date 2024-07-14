const app = require('../../src/app');
module.exports = {
    getCreateTestApp
};

let testApp;
let shouldInitiate = true;

async function getCreateTestApp() {
    if (shouldInitiate) {
        shouldInitiate = false;
        testApp = await app();
    }

    return testApp;
}
