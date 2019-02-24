
module.exports = {
  PERFORMANCE_FRAMEWORK_BUCKET_PATH: (process.env.NODE_ENV === 'production') ? 'predator' : '',
  PERFORMANCE_FRAMEWORK_API_URL: process.env.PERFORMANCE_FRAMEWORK_API_URL || 'http://predator.performance-framework.dcos-internal.qa-fra-apps.zooz.co/v1',
};
