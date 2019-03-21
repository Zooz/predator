
module.exports = {
    PREDATOR_BUCKET_PATH: (process.env.NODE_ENV === 'production') ? 'predator' : '',
    PREDATOR_URL: process.env.PREDATOR_URL || 'http://localhost:80/v1'
};
