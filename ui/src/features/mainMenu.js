import {
    faVial,
    faBriefcase,
    faFlagCheckered,
    faFileAlt,
    faBook,
    faPassport,
    faWrench
} from '@fortawesome/free-solid-svg-icons';

import { PREDATOR_DOCS_URL } from '../App/common/env';

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
                linkUrl: `${PREDATOR_DOCS_URL}/about.html`,
                icon: faBook
            }, {
                key: 1,
                primaryText: 'API Reference',
                linkUrl: `${PREDATOR_DOCS_URL}/indexapiref.html`,
                icon: faPassport
            }]
    }
];
