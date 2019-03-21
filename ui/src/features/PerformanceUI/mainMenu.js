module.exports = [
  {
    key: 0,
    primaryText: 'Tests',
    navigateTo: 'tests'
  },
  {
    key: 1,
    primaryText: 'Scheduled Jobs',
    navigateTo: 'jobs'
  },
  {
    key: 2,
    primaryText: 'Last Reports',
    navigateTo: 'last_reports'
  },
  {
    key: 3,
    primaryText: 'Configuration',
    navigateTo: 'configuration'
  },
  {
    key: 4,
    primaryText: 'Docs',
    nestedItems: [
      {
        key: 0,
        primaryText: 'Documentation',
        linkUrl: 'https://zooz.github.io/predator/index'
      }, {
        key: 1,
        primaryText: 'API Reference',
        linkUrl: 'https://zooz.github.io/predator/#indexapiref.html'
      }]
  }
];
