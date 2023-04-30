// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { computed, ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

export const useTheHistoryStore = createGlobalState(() => {
  const items = ref<Array<Item>>([])

  const count = computed<number>(() => items.value.length)

  function has (item?: Item): boolean {
    if (!item) { return false }
    return items.value.some((itm) => itm.src === item.src)
  }

  function add (item: Item): void {
    items.value = [ ...items.value, item ]
  }

  function remove (item: Item): void {
    items.value = items.value.filter((itm) => itm.src !== item.src)
  }

  function reset (): void {
    items.value = []
  }

  return {
    items,
    count,

    has,
    add,
    remove,
    reset,
  }
})
