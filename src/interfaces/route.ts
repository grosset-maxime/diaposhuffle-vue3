export interface IRoute {
  icon: string;
  title: string;
  name: string;
  path: string;
  component(): Promise<unknown>;
}
