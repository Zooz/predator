// Icons name what the destination does, not a loose metaphor: a clock for things
// that run on a schedule, a chart for results, a plug for outbound notifications.
import {
  faVial,
  faClock,
  faChartLine,
  faBookOpen,
  faBook,
  faCode,
  faSliders,
  faCodeBranch,
  faFlask,
  faPlug
} from '@fortawesome/free-solid-svg-icons';

import { PREDATOR_DOCS_URL } from '../App/common/env';

export default function getMenuList ({ CHAOS_MESH_ENABLED }) {
  const baseMenuItems = [
    {
      primaryText: 'Tests',
      navigateTo: 'tests',
      icon: faVial
    },
    {
      primaryText: 'Scheduled Runs',
      navigateTo: 'jobs',
      icon: faClock
    },
    {
      primaryText: 'Last Reports',
      navigateTo: 'last_reports',
      icon: faChartLine
    },
    {
      primaryText: 'Processors',
      navigateTo: 'processors',
      icon: faCodeBranch
    },
    {
      primaryText: 'Webhooks',
      navigateTo: 'webhooks',
      icon: faPlug
    },
    {
      primaryText: 'Settings',
      navigateTo: 'settings',
      icon: faSliders
    },
    {
      primaryText: 'Docs',
      icon: faBookOpen,
      nestedItems: [
        {
          primaryText: 'Documentation',
          linkUrl: `${PREDATOR_DOCS_URL}/about.html`,
          icon: faBook
        },
        {
          primaryText: 'API Reference',
          linkUrl: `${PREDATOR_DOCS_URL}/indexapiref.html`,
          icon: faCode
        }
      ]
    }
  ];

  if (CHAOS_MESH_ENABLED) {
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
