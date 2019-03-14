
module.exports = {
  PREDATOR_BUCKET_PATH: (process.env.NODE_ENV === 'production') ? 'predator' : '',
  PREDATOR_URL: 'http://localhost:80/v1' || '/v1'
};
