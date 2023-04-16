// TODO: Feature: Add fetch items from bdd with tags and types. DONE ?
// TODO: Bug: Backend: getimagesize raize warning in call response body that
//            trigger json.parse to fail. Should be added to the response object as error.

// Types
import type { Ref, ComputedRef } from 'vue'
import type { Item } from '@/models/item'

// Vendors Libs
import { computed, ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

import { buildError } from '@/api/api'
import {
  deleteItem as deleteItemAPI,
  setItemTags as setItemTagsAPI,
} from '@/api/items'


export enum FetchSource {
  fs = 'random', // Fetch from fs.
  db = 'items', // Fetch from Items list returned by data base.
  pineds = 'pineds', // Fetch from pined items list.
  history = 'history', // Last shown items.
}

export const useThePlayerStore = createGlobalState(() => {
  const isStopped = ref(true)
  const isPlaying = ref(false)
  const isPaused = ref(false)

  const isFetching = ref(false)

  // Item states
  const item = ref<Item | undefined>()
  const itemIndex = ref(NaN)
  const itemsCount = ref(NaN)

  const isPlayingItemVideo = ref(false)
  const isPinedItem = ref(false)

  // const fetchSource = ref<FetchSource>(FetchSource.fs)

  const errors = ref<Array<{ [key: string]: unknown }>>([])

  // const getFetchSource = () => fetchSource.value
  // const getErrors = () => errors.value


  // Mutations
  // const setFetchSource = (val: FetchSource) => (fetchSource.value = val)
  const addError = ({ actionName, error }: { actionName: string; error: unknown }) => {
    errors.value.push({
      [ actionName ]: error,
    })
    // eslint-disable-next-line no-console
    console.error(actionName, error)
  }

  // #region Actions
  async function deleteItem ({
    item,
    fromBddOnly,
    ignoreIfNotExist,
  }: {
    item: Item;
    fromBddOnly?: boolean;
    ignoreIfNotExist?: boolean;
  }) {
    let result = false

    try {
      const response = await deleteItemAPI({ item, fromBddOnly, ignoreIfNotExist })
      result = response.success
    } catch (e) {
      const error = buildError(e)
      addError({
        actionName: 'PLAYER_A_DELETE_ITEM',
        error,
      })
      throw error
    }

    return result
  }

  async function setItemTags ({ item }: { item: Item }) {
    let result = false

    try {
      const response = await setItemTagsAPI({ item })
      result = response.success
    } catch (e) {
      const error = buildError(e)
      addError({
        actionName: 'PLAYER_A_SET_ITEM_TAGS',
        error,
      })

      throw error
    }

    return result
  }
  // #endregion Actions

  return {
    isStopped,
    isPlaying,
    isPaused,
    isFetching,

    item,
    itemIndex,
    itemsCount,

    isPlayingItemVideo,
    isPinedItem,

    deleteItem,
    setItemTags,
  }
})
