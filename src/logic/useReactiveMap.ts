import { computed, ref } from 'vue'

export interface ReactiveMap<K, V> extends Map<K, V> {
  /**
   * Set multiple values to the Map.
   * @param values - Values to set.
   * @param opts - Options
   * @default {}
   * @param opts.clear - Should clear the Map before to set values.
   * @default false
   */
  setValues: (
    values: [K, V][] | Map<K, V>,
    opts?: { clear?: boolean }
  ) => ReactiveMap<K, V>
}

export default function useReactiveMap<K, V> (values?: [K, V][] | Map<K, V>) {
  const version = ref<number>(1)

  class ReactiveMap extends Map<K, V> {
    set (key: K, value: V): this {
      super.set(key, value)
      this.#incVersion()
      return this
    }

    delete (key: K): boolean {
      const res = super.delete(key)
      res && this.#incVersion()
      return res
    }

    clear (): this {
      super.clear()
      this.#incVersion()
      return this
    }

    setValues (
      values: [K, V][] | Map<K, V>,
      { clear = false }: { clear?: boolean } = {},
    ): this {
      clear && this.clear()

      const vals = Array.isArray(values)
        ? values
        : Array.from(values)

      vals.forEach(([ k, v ]) => this.set(k, v))
      return this
    }

    /**
     * @private
     */
    #incVersion (): this {
      version.value += 1
      return this
    }
  }

  const inner = ref<ReactiveMap>(new ReactiveMap())

  if (values)
    inner.value.setValues(values)

  const map = computed<ReactiveMap>(() => {
    // Eslint bypass to avoid no-unused-expressions error,
    // but need to update this computed when version.value change.
    return version.value
      ? inner.value
      : inner.value
  })

  return map
}
