
const request = require('supertest'),
    expressApp = require('../../../../src/app');
let app;
module.exports = {
    init,
    createProcessor
};
async function init() {
    try {
        app = await expressApp();
    } catch (err){
        console.log(err);
        process.exit(1);
    }
}

function createProcessor(body, headers) {
    return request(app).post('/v1/processors')
        .send(body)
        .set(headers)
        .expect(function(res){
            return res;
        });
}