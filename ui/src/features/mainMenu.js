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
import { KUBERNETES } from '../constants';

export default function getMenuList (platform) {
  const baseMenuItems = [
    {
      primaryText: 'Tests',
      navigateTo: 'tests',
      icon: faVial
    },
    {
      primaryText: 'Scheduled Runs',
      navigateTo: 'jobs',
      icon: faBriefcase
    },
    {
      primaryText: 'Last Reports',
      navigateTo: 'last_reports',
      icon: faFlagCheckered
    },
    {
      primaryText: 'Processors',
      navigateTo: 'processors',
      icon: faMicrochip
    },
    {
      primaryText: 'Webhooks',
      navigateTo: 'webhooks',
      icon: faExternalLinkAlt
    },
    {
      primaryText: 'Settings',
      navigateTo: 'settings',
      icon: faWrench
    },
    {
      primaryText: 'Docs',
      icon: faFileAlt,
      nestedItems: [
        {
          primaryText: 'Documentation',
          linkUrl: `${PREDATOR_DOCS_URL}/about.html`,
          icon: faBook
        },
        {
          primaryText: 'API Reference',
          linkUrl: `${PREDATOR_DOCS_URL}/indexapiref.html`,
          icon: faPassport
        }
      ]
    }
  ];

  if (platform === KUBERNETES) {
    const chaosItem = {
      primaryText: 'Chaos',
      navigateTo: 'chaos_experiments',
      icon: faFlask
    };
    baseMenuItems.splice(4, 0, chaosItem); // Insert the chaos item at the 4th index
  }

  // Assign keys dynamically based on the final list
  return baseMenuItems.map((item, index) => ({
    ...item,
    key: index
  }));
};
