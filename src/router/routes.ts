import type { IRoute } from '../interfaces/route';

const routes: IRoute[] = [
  {
    path: '/diaposhuffle',
    name: 'diaposhuffle',
    title: 'DiapoShuffle',
    icon: 'mdi-shuffle-variant',
    component: () => import('../views/DiapoShuffleView.vue'),
  },
  {
    path: '/export',
    name: 'export',
    title: 'Export',
    icon: 'mdi-database-export',
    component: () => import('../views/ExportView.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    title: 'Settings',
    icon: 'mdi-cog',
    component: () => import('../views/SettingsView.vue'),
  },
];

export const routesMap = new Map<string, IRoute>();
routes.forEach((i: IRoute) => {
  routesMap.set(i.path, i);
});

export default routesMap;
