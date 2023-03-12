import type { RouteComponent } from 'vue-router';

export interface IRoute {
  icon: string;
  title: string;
  name: string;
  path: string;
  component: RouteComponent;
}
