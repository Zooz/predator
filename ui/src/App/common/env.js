module.exports = {
    PREDATOR_URL: generatePredatorUrl(),
    BUCKET_PATH: generateBucketPath()
};

function generatePredatorUrl() {
    if (process.env.PREDATOR_URL){
        return process.env.PREDATOR_URL;
    }
    if (process.env.BUCKET_PATH) {
        return `${process.env.BUCKET_PATH}/v1`;
    }
    return '/v1';
}

function generateBucketPath() {
    let path = '/ui/';
    if (process.env.NODE_ENV !== 'production'){
        path = '';
    }
    if (process.env.BUCKET_PATH) {
        path = `${process.env.BUCKET_PATH}/ui/`;
    }
    return path;
}