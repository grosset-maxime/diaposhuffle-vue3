// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

// Libs
import {
  fetchItemsFromBdd as fetchItemsFromBddAPI,
} from '@/api/items'

// Stores
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptions'
import { useErrorStore } from '@/stores/errorStore'

export const useDBPlayerStore = createGlobalState(() => {
  const sourceOptsStore = useSourceOptionsStore()
  const errorStore = useErrorStore()

  // #region states
  const isStopped = ref(true)
  const isPaused = ref(false)

  const items = ref<Array<Item>>([])
  const item = ref<Item | undefined>()
  const itemIndex = ref<number>(-1)

  const nextItem = ref<Item | undefined>()
  const nextItemIndex = ref<number>(NaN)
  // #endregion states

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

  async function fetchItems (): Promise<Array<Item>> {
    try {
      const itms: Array<Item> = await fetchItemsFromBddAPI({
        tags: Array.from(sourceOptsStore.tags.value),
        tagsOperator: sourceOptsStore.tagsOperator.value,
        types: sourceOptsStore.fileTypes.value,
      })

      return itms

    } catch (e) {
      throw errorStore.add(e, {
        file: 'dbPlayerStore.ts',
        actionName: 'PLAYER_A_FETCH_ITEMS_FROM_BDD',
      })
    }
  }

  return {
    isStopped,
    isPaused,
    items,
    item,
    itemIndex,
    nextItem,
    nextItemIndex,

    has,
    add,
    remove,
    reset,
    fetchItems,
  }
})
