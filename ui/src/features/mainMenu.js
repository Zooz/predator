import {
    faVial,
    faBriefcase,
    faFlagCheckered,
    faFileAlt,
    faBook,
    faPassport,
    faWrench
} from '@fortawesome/free-solid-svg-icons'

module.exports = [
    {
        key: 0,
        primaryText: 'Tests',
        navigateTo: 'tests',
        icon: faVial
    },
    {
        key: 1,
        primaryText: 'Scheduled Jobs',
        navigateTo: 'jobs',
        icon: faBriefcase
    },
    {
        key: 2,
        primaryText: 'Last Reports',
        navigateTo: 'last_reports',
        icon: faFlagCheckered
    },
    {
        key: 3,
        primaryText: 'Configuration',
        navigateTo: 'configuration',
        icon: faWrench
    },
    {
        key: 4,
        primaryText: 'Docs',
        icon: faFileAlt,
        nestedItems: [
            {
                key: 0,
                primaryText: 'Documentation',
                linkUrl: 'https://zooz.github.io/predator/about.html',
                icon: faBook
            }, {
                key: 1,
                primaryText: 'API Reference',
                linkUrl: 'https://zooz.github.io/predator/indexapiref.html',
                icon: faPassport
            }]
    }
];
