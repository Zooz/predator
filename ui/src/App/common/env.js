module.exports = {
    PREDATOR_URL: generatePredatorUrl(),
    BUCKET_PATH: generateBucketPath()
};

function generatePredatorUrl() {
    if(process.env.PREDATOR_URL){
        return process.env.PREDATOR_URL;
    }
    if (process.env.BUCKET_PATH) {
        return `${process.env.BUCKET_PATH}/v1`;
    }
    return '/v1';
}

function generateBucketPath() {
    if(process.env.NODE_ENV !== 'production'){
        return ''
    }
    if (process.env.BUCKET_PATH) {
        return `${process.env.BUCKET_PATH}/ui/`
    }
    return '/ui/';


}