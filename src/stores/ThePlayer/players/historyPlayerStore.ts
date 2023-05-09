// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { computed, ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

export const useHistoryPlayerStore = createGlobalState(() => {

  // #region states
  const isStopped = ref(true)
  const isPaused = ref(false)

  const items = ref<Array<Item>>([])
  const item = ref<Item | undefined>()
  const itemIndex = ref<number>(NaN)

  const nextItem = ref<Item | undefined>()
  const nextItemIndex = ref<number>(NaN)
  // #endregion states

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
    isStopped.value = true
    isPaused.value = false

    items.value = []
    itemIndex.value = NaN
    item.value = undefined
    nextItem.value = undefined
    nextItemIndex.value = NaN
  }

  return {
    isStopped,
    isPaused,
    items,
    item,
    itemIndex,
    nextItem,
    nextItemIndex,
    count,

    has,
    add,
    remove,
    reset,
  }
})
