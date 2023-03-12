import { createRouter, createWebHistory } from 'vue-router';
import RoutesMap from './routes';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: Array.from(RoutesMap.values()),
});

export default router;
