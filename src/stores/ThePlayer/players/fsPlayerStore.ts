// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

// Libs
import {
  fetchRandomItem as fetchRandomItemAPI,
} from '@/api/items'

// Stores
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptionsStore'
import {
  ON_FS_PLAYER_STORE_AFTER_DELETE_ITEM,
  ON_ITEM_DELETED,
  emitter,
} from '@/logic/useEmitter'
import { createCustomError, type CustomError, type CustomErrorData } from '@/models/customError'
import { logError } from '@/utils/errorUtils'

export const useFSPlayerStore = createGlobalState(() => {

  const sourceOptsStore = useSourceOptionsStore()

  // #region States
  const isStopped = ref(true)
  const isPaused = ref(false)
  const isOnHold = ref(false)

  const item = ref<Item | undefined>()

  const nextItem = ref<Item | undefined>()
  const fetchNextItemPromise = ref<Promise<Item> | undefined>()
  const isFetchingNextItem = ref(false)
  // #endregion States

  // #region Private Methods
  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    const customError = createCustomError(error, {
      ...errorData,
      file: 'stores/fsPlayerStore.ts',
    })
    logError(customError)

    return customError
  }

  async function onDeleteItem (itm: Item) {
    if (item.value?.src === itm.src) {
      item.value = undefined
    }

    if (isFetchingNextItem.value) {
      await fetchNextItemPromise.value
    }

    if (nextItem.value && nextItem.value.src === itm.src) {
      nextItem.value = undefined
    }

    // Dispatch an event to tell to player that the item was remove from the store.
    emitter.emit(ON_FS_PLAYER_STORE_AFTER_DELETE_ITEM, itm)
  }
  // #endregion Private Methods

  // #region Actions
  function reset (): void {
    isStopped.value = true
    isPaused.value = false
    isOnHold.value = false

    item.value = undefined

    nextItem.value = undefined
    fetchNextItemPromise.value = undefined
    isFetchingNextItem.value = false
  }

  async function fetchItem (): Promise<Item> {
    try {

      const item = await fetchRandomItemAPI({
        folders: Array.from(sourceOptsStore.folders.value),
      })

      if (!item) {
        throw 'No item found from fs.'
      }

      return item
    } catch (e) {
      throw onError(e, { actionName: 'fetchItem' })
    }

  }
  // #endregion Actions

  emitter.on(ON_ITEM_DELETED, onDeleteItem)

  return {
    isStopped,
    isPaused,
    isOnHold,

    item,
    nextItem,
    fetchNextItemPromise,
    isFetchingNextItem,

    reset,
    fetchItem,
  }
})
