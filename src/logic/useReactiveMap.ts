import { computed, ref } from 'vue'

export interface ReactiveMap<K, V> extends Map<K, V> {
  setValues: (
    values: Array<[K, V]> | Map<K, V>,
    opts?: { clear?: boolean }
  ) => ReactiveMap<K, V>
}

export default function useReactiveMap<K, V> (values?: Array<[K, V]> | Map<K, V>) {
  const version = ref(1)

  class ReactiveMap extends Map<K, V> {
    set (key: K, value: V) {
      super.set(key, value)
      this.#incVersion()
      return this
    }

    delete (key: K) {
      const res = super.delete(key)
      res && this.#incVersion()
      return res
    }

    clear () {
      super.clear()
      this.#incVersion()
      return this
    }

    setValues (
      values: Array<[K, V]> | Map<K, V>,
      { clear = false }: { clear?: boolean } = {},
    ) {
      clear && this.clear()

      const vals = Array.isArray(values)
        ? values
        : Array.from(values)

      vals.forEach(([ k, v ]) => this.set(k, v))
      return this
    }

    #incVersion () {
      version.value += 1
    }
  }

  const inner = ref(new ReactiveMap())

  if (values) {
    inner.value.setValues(values)
  }

  const map = computed(() => {
    version.value
    return inner.value
  })

  return map
}