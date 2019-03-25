
module.exports = {
    PREDATOR_BUCKET_PATH: (process.env.NODE_ENV === 'production') ? 'predator' : '',
    PREDATOR_URL: process.env.PREDATOR_URL || 'http://predator.dcos-internal.mars-fra-apps.zooz.co/v1'
};
