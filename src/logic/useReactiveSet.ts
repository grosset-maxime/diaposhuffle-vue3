import { computed, ref } from 'vue'

export interface ReactiveSet<T> extends Set<T> {
  /**
   * Add multiple values to the Set.
   * @param values - Values to add.
   * @param opts - Options
   * @default {}
   * @param opts.clear - Should clear the Set before to add values.
   * @default false
   */
  addValues: (
    values: T[] | Set<T>,
    opts?: { clear?: boolean }
  ) => ReactiveSet<T>
}

export default function useReactiveSet<T> (values?: T[] | Set<T>) {
  const version = ref<number>(1)

  class ReactiveSet extends Set<T> {
    add (value: T): this {
      super.add(value)
      this.#incVersion()
      return this
    }

    delete (value: T): boolean {
      const res = super.delete(value)
      res && this.#incVersion()
      return res
    }

    clear (): this {
      super.clear()
      this.#incVersion()
      return this
    }

    addValues (
      values: T[] | Set<T>,
      { clear = false }: { clear?: boolean } = {},
    ): this {
      clear && this.clear()
      values.forEach((val) => this.add(val))
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

  const inner = ref<ReactiveSet>(new ReactiveSet())

  if (values)
    inner.value.addValues(values)

  const set = computed<ReactiveSet>(() => {
    // Eslint bypass to avoid no-unused-expressions error,
    // but need to update this computed when version.value change.
    return version.value
      ? inner.value
      : inner.value
  })

  return set
}
