// TODO: Bug: Backend: getimagesize raize warning in call response body that
//            trigger json.parse to fail. Should be added to the response object as error.

// Types
import type { Item } from '@/models/item'
import type { PlayerName } from '@/logic/ThePlayer/useThePlayer'

// Vendors Libs
import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

import {
  deleteItem as deleteItemAPI,
  setItemTags as setItemTagsAPI,
} from '@/api/items'
import { createCustomError, type CustomError, type CustomErrorData } from '@/models/customError'
import { logError } from '@/utils/errorUtils'

export const useThePlayerStore = createGlobalState(() => {
  // Player states
  const isStopped = ref(true)
  const isPaused = ref(false)
  const playerName = ref<PlayerName | undefined>()

  // Item states
  const item = ref<Item | undefined>()
  const itemIndex = ref<number>(NaN)
  const itemsCount = ref<number>(NaN)
  const isItemPaused = ref(false)
  const isItemPlayable = ref(false)
  const isItemVideo = ref(false)

  // Player's components/feature enabled/disabled
  const theLoopEnabled = ref(false)
  const itemsInfoEnabled = ref(false)
  const historyEnabled = ref(false)
  const pauseEnabled = ref(false)

  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    const customError = createCustomError(error, {
      ...errorData,
      file: 'stores/ThePlayerStore.ts',
    })
    logError(customError)

    return customError
  }

  // #region Methods
  function resetPlayerFeatures () {
    // Player's components/feature enabled/disabled
    theLoopEnabled.value = false
    itemsInfoEnabled.value = false
    historyEnabled.value = false
    pauseEnabled.value = false
  }
  // #endregion Methods

  // #region Actions
  async function deleteItem ({ item }: { item: Item }): Promise<boolean> {
    try {
      const response = await deleteItemAPI({ item })
      return !!response.success
    } catch (e) {
      throw onError(e, { actionName: 'deleteItem' })
    }
  }

  async function setItemTags ({ item }: { item: Item }): Promise<boolean> {
    let result = false

    try {
      const response = await setItemTagsAPI({ item })
      result = response.success
    } catch (e) {
      throw onError(e, { actionName: 'setItemTags' })
    }

    return result
  }

  function reset (): void {
    item.value = undefined
    itemIndex.value = NaN
    isItemPaused.value = false
    isItemPlayable.value = false
    isItemVideo.value = false
    itemsCount.value = NaN

    resetPlayerFeatures()
  }
  // #endregion Actions

  return {
    // Player states
    isStopped,
    isPaused,
    playerName,

    // Item states
    item,
    itemIndex,
    itemsCount,
    isItemPaused,
    isItemPlayable,
    isItemVideo,

    // Player's components/feature enabled/disabled
    theLoopEnabled,
    itemsInfoEnabled,
    historyEnabled,
    pauseEnabled,

    // Actions
    deleteItem,
    setItemTags,
    reset,
    resetPlayerFeatures,
  }
})
