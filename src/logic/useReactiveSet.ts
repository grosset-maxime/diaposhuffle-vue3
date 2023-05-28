import { computed, ref } from 'vue'

export interface ReactiveSet<T> extends Set<T> {
  setValues: (
    values: Array<T> | Set<T>,
    opts?: { clear?: boolean }
  ) => ReactiveSet<T>
}

export default function useReactiveSet<T> (values?: Array<T> | Set<T>) {
  const version = ref(1)

  class ReactiveSet extends Set<T> {
    add (value: T) {
      super.add(value)
      this.#incVersion()
      return this
    }

    delete (value: T) {
      const res = super.delete(value)
      res && this.#incVersion()
      return res
    }

    clear () {
      super.clear()
      this.#incVersion()
      return this
    }

    setValues (
      values: Array<T> | Set<T>,
      { clear = false }: { clear?: boolean } = {},
    ) {
      clear && this.clear()
      values.forEach((val) => this.add(val))
      return this
    }

    #incVersion () {
      version.value += 1
    }
  }

  const inner = ref(new ReactiveSet())

  if (values) {
    inner.value.setValues(values)
  }

  const set = computed(() => {
    version.value
    return inner.value
  })

  return set
}