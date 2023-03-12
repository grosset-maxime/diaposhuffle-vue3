export type ExtractComponentProps<TComponent> = TComponent extends new () => {
  $props: infer P;
}
  ? P
  : never;
