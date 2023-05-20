// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { computed, ref } from 'vue'
import { createGlobalState } from '@vueuse/core'
import {
  ON_HISTORY_PLAYER_STORE_AFTER_DELETE_ITEM,
  ON_ITEM_DELETED,
  emitter,
} from '@/logic/useEmitter'

export const useHistoryPlayerStore = createGlobalState(() => {

  // #region States
  const isStopped = ref(true)
  const isPaused = ref(false)
  const isOnHold = ref(false)

  const items = ref<Array<Item>>([])
  const item = ref<Item | undefined>()
  const itemIndex = ref<number>(NaN)

  const nextItem = ref<Item | undefined>()
  const nextItemIndex = ref<number>(NaN)
  // #endregion States

  const count = computed<number>(() => items.value.length)

  // #region Private Methods
  function onDeleteItem (itm: Item): void {
    const itms: Array<Item> = items.value
    let itmIndex: number = itemIndex.value
    let itemFound = false

    for (let i = itms.length - 1; i >= 0; i--) {
      if (itms[ i ].src === itm.src) {
        itemFound = true
        itms.splice(i, 1) // Remove the item from the array by its index.

        if (i <= itmIndex) {
          itmIndex = itmIndex - 1
        }

        if (item.value?.src === itm.src) {
          item.value = undefined
        }
      }
    }

    if (itemFound) {
      items.value = itms.slice() // Clone the array (FASTEST).
      itemIndex.value = itmIndex
    }

    // Dispatch an event to tell to player that the item was remove from the store.
    emitter.emit(ON_HISTORY_PLAYER_STORE_AFTER_DELETE_ITEM, itm)
  }
  // #endregion Private Methods

  // #region Actions
  function add (item: Item): void {
    items.value = [ ...items.value, item ]
  }

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
    count,

    add,
    reset,
  }
})
