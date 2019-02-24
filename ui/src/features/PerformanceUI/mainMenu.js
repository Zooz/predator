module.exports = [
  {
    key: 0,
    primaryText: 'Tests',
    nestedItems: [
      {
        key: 0,
        primaryText: 'View tests',
        navigateTo: 'tests'
      }]
  },
  {
    key: 1,
    primaryText: 'Jobs',
    nestedItems: [
      {
        key: 0,
        primaryText: 'View Jobs',
        navigateTo: 'jobs'
      }]
  },
  {
    key: 2,
    primaryText: 'Reports',
    nestedItems: [
      {
        key: 0,
        primaryText: 'Last Reports',
        navigateTo: 'last_reports'
      }]
  },
  {
    key: 3,
    primaryText: 'Docs',
    nestedItems: [
      {
        key: 0,
        primaryText: 'Tests API',
        linkUrl: 'https://git.zooz.co/PaymentsOS/performance-framework/api/blob/master/docs/swagger.yaml'
      }, {
        key: 1,
        primaryText: 'Scheduler API',
        linkUrl: 'https://git.zooz.co/PaymentsOS/performance-framework/scheduler/blob/master/docs/swagger.yaml'
      }, {
        key: 2,
        primaryText: 'Reporter API',
        linkUrl: 'https://git.zooz.co/PaymentsOS/performance-framework/reporter/blob/master/docs/swagger.yaml'
      }]
  }
];
