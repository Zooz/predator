import {
    faVial,
    faBriefcase,
    faFlagCheckered,
    faFileAlt,
    faBook,
    faPassport
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
        primaryText: 'Docs',
        icon: faFileAlt,
        nestedItems: [
            {
                key: 0,
                primaryText: 'Documentation',
                linkUrl: 'https://predator-ng.com/about.html',
                icon: faBook
            }, {
                key: 1,
                primaryText: 'API Reference',
                linkUrl: 'https://zooz.github.io/predator/indexapiref.html',
                icon: faPassport
            }]
    }
];
