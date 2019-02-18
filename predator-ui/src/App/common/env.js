
module.exports = {
  PERFORMANCE_FRAMEWORK_BUCKET_PATH: (process.env.NODE_ENV === 'production') ? 'predator' : '',
  PAYMENTS_OS_URL: process.env.PAYMENTS_OS_URL || 'https://api-qa.paymentsos.com',
  PERFORMANCE_FRAMEWORK_API_URL: process.env.PERFORMANCE_FRAMEWORK_API_URL || 'http://localhost:3000/v1' || `http://predator.performance-framework.dcos-internal.qa-fra-apps.zooz.co/v1`,
  // PERFORMANCE_FRAMEWORK_SCHEDULER_URL: process.env.PERFORMANCE_FRAMEWORK_SCHEDULER_URL || `${PAYMENTS_OS_URL}/predator/scheduler-api`,
  // PERFORMANCE_FRAMEWORK_REPORTER_URL: process.env.PERFORMANCE_FRAMEWORK_REPORTER_URL || `${PAYMENTS_OS_URL}/predator/reporter-api`,
  // CONTROL_CENTER_URL: process.env.ADMIN_TOOLS_URL || 'https://control-qa.paymentsos.com/'
};
