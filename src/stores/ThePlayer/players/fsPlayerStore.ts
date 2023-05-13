// Types
import type { Item } from '@/models/item'
import type { CustomError, CustomErrorData } from '@/models/error'

// Vendors Libs
import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

// Libs
import {
  fetchRandomItem as fetchRandomItemAPI,
} from '@/api/items'

// Stores
import { useErrorStore } from '@/stores/errorStore'
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptions'

export const useFSPlayerStore = createGlobalState(() => {
  const errorStore = useErrorStore()
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

  // #region Methods
  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    return errorStore.add(error, {
      ...errorData,
      file: 'fsPlayerStore.ts',
      actionName: 'PLAYER_A_FETCH_PREV',
    })
  }

  function reset (): void {
    isStopped.value = true
    isPaused.value = false

    item.value = undefined
    nextItem.value = undefined
    fetchNextItemPromise.value = undefined
    isFetchingNextItem.value = false
  }

  async function fetchItem (): Promise<Item> {
    let item: Item | undefined

    try {

      item = await fetchRandomItemAPI({
        folders: Array.from(sourceOptsStore.folders.value),
      })

    } catch (e) {
      throw onError(e)
    }

    if (!item) {
      throw onError('No item found from fs.')
    }

    return item
  }
  // #endregion Methods

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
