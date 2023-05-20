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
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptionsStore'
import { useErrorStore } from '@/stores/errorStore'

// Logics
import {
  ON_DB_PLAYER_STORE_AFTER_DELETE_ITEM,
  ON_ITEM_DELETED,
  emitter,
} from '@/logic/useEmitter'

export const useDBPlayerStore = createGlobalState(() => {

  const sourceOptsStore = useSourceOptionsStore()
  const errorStore = useErrorStore()

  // #region States
  const isStopped = ref(true)
  const isPaused = ref(false)
  const isOnHold = ref(false)

  const items = ref<Array<Item>>([])
  const item = ref<Item | undefined>()
  const itemIndex = ref<number>(-1)

  const nextItem = ref<Item | undefined>()
  const nextItemIndex = ref<number>(NaN)
  // #endregion States

  // #region Private Methods
  function onDeleteItem (itm: Item): void {
    const itms: Array<Item> = items.value
    let itmIndex: number | undefined

    if (item.value?.src === itm.src) {
      itmIndex = itemIndex.value
      item.value = undefined
    } else {
      for (let i = itms.length - 1; i >= 0; i--) {
        if (itms[ i ].src === itm.src) {
          itmIndex = i
          break
        }
      }
    }

    if (typeof itmIndex === 'number') {
      itms.splice(itmIndex, 1) // Remove the item from the array by its index.
      items.value = itms.slice() // Clone the array (FASTEST).
      itemIndex.value = (itmIndex || 0) - 1
    }

    // Dispatch an event to tell to player that the item was remove from the store.
    emitter.emit(ON_DB_PLAYER_STORE_AFTER_DELETE_ITEM, itm)
  }
  // #endregion Private Methods

  // #region Actions
  function reset (): void {
    isStopped.value = true
    isPaused.value = false
    isOnHold.value = false

    items.value = []
    item.value = undefined
    itemIndex.value = NaN

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
  // #endregion Actions

  emitter.on(ON_ITEM_DELETED, onDeleteItem)

  return {
    isStopped,
    isPaused,
    isOnHold,

    items,
    item,
    itemIndex,
    nextItem,
    nextItemIndex,

    reset,
    fetchItems,
  }
})
