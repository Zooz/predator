import {
  faVial,
  faBriefcase,
  faFlagCheckered,
  faFileAlt,
  faBook,
  faPassport,
  faWrench,
  faMicrochip,
  faFlask,
  faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';

import { PREDATOR_DOCS_URL } from '../App/common/env';

export default [
  {
    key: 0,
    primaryText: 'Tests',
    navigateTo: 'tests',
    icon: faVial
  },
  {
    key: 1,
    primaryText: 'Scheduled Runs',
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
    primaryText: 'Processors',
    navigateTo: 'processors',
    icon: faMicrochip
  },
  {
    key: 4,
    primaryText: 'Chaos',
    navigateTo: 'chaos_experiments',
    icon: faFlask
  },
  {
    key: 5,
    primaryText: 'Webhooks',
    navigateTo: 'webhooks',
    icon: faExternalLinkAlt
  },
  {
    key: 6,
    primaryText: 'Settings',
    navigateTo: 'settings',
    icon: faWrench
  },
  {
    key: 7,
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
