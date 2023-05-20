// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'
import {
  emitter,
  ON_ITEM_UNPINED,
  ON_ITEM_DELETED,
} from '@/logic/useEmitter'

export const usePinedPlayerStore = createGlobalState(() => {

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

  // #region Private Methods
  function onRemoveItem (itm: Item): boolean {
    const itms: Array<Item> = items.value
    let itmIndex: number | undefined
    let itemRemoved = false

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
      itemRemoved = true
    }

    return itemRemoved
  }
  // #endregion Private Methods

  // #region Actions
  function has (item?: Item): boolean {
    if (!item) { return false }
    return items.value.some((itm) => itm.src === item.src)
  }

  function add (item: Item): void {
    items.value = [ ...items.value, item ]
  }

  function remove (item: Item): void {
    const isItemRemoved = onRemoveItem(item)

    if (isItemRemoved) {
      emitter.emit(ON_ITEM_UNPINED, item)
    }
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

  emitter.on(ON_ITEM_DELETED, remove)

  return {
    isStopped,
    isPaused,
    isOnHold,

    items,
    item,
    itemIndex,
    nextItem,
    nextItemIndex,

    has,
    add,
    remove,
    reset,
  }
})
