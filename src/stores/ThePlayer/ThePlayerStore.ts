// TODO: Bug: Backend: getimagesize raize warning in call response body that
//            trigger json.parse to fail. Should be added to the response object as error.

// Types
import type { Item } from '@/models/item'
import type { PlayerName } from '@/logic/ThePlayer/thePlayer'

// Vendors Libs
import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

import {
  deleteItem as deleteItemAPI,
  setItemTags as setItemTagsAPI,
} from '@/api/items'
import { createError } from '@/models/error'

export const useThePlayerStore = createGlobalState(() => {
  // Player states
  const isStopped = ref(true)
  const isPaused = ref(false)
  const playerName = ref<PlayerName | undefined>()

  // Item states
  const item = ref<Item | undefined>()
  const itemIndex = ref(NaN)
  const itemsCount = ref(NaN)
  const isItemPaused = ref(false)
  const isItemPlayable = ref(false)
  const isItemVideo = ref(false)

  // Player's components/feature enabled/disabled
  const theLoopEnabled = ref(false)
  const itemsInfoEnabled = ref(false)
  const historyEnabled = ref(false)
  const pauseEnabled = ref(false)

  const errors = ref<Array<{ [key: string]: unknown }>>([])
  // const getErrors = () => errors.value


  // Mutations
  const addError = ({ actionName, error }: { actionName: string; error: unknown }) => {
    errors.value.push({
      [ actionName ]: error,
    })
    console.error(actionName, error)
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
    let result = false

    try {
      const response = await deleteItemAPI({ item })
      result = response.success
    } catch (e) {
      const error = createError(e, {
        file: 'ThePlayerStore.ts',
      })
      addError({
        actionName: 'PLAYER_A_DELETE_ITEM',
        error,
      })
      throw error
    }

    return result
  }

  async function setItemTags ({ item }: { item: Item }): Promise<boolean> {
    let result = false

    try {
      const response = await setItemTagsAPI({ item })
      result = response.success
    } catch (e) {
      const error = createError(e, {
        file: 'ThePlayerStore.ts',
      })
      addError({
        actionName: 'PLAYER_A_SET_ITEM_TAGS',
        error,
      })

      throw error
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
