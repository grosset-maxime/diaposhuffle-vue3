// TODO: Feature: Add fetch items from bdd with tags and types. DONE ?
// TODO: Bug: Backend: getimagesize raize warning in call response body that
//            trigger json.parse to fail. Should be added to the response object as error.

// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

import { getRandomElementWithIndex } from '@/utils/utils'
import { buildError } from '@/api/api'
import {
  fetchItemsFromBdd as fetchItemsFromBddAPI,
} from '@/api/items'
// import { Item as ItemClass } from '@/models/item'

// Stores
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptions'

export const useDBPlayerStore = createGlobalState(() => {
  const playerOptsStore = usePlayerOptionsStore()
  const sourceOptsStore = useSourceOptionsStore()

  // State
  const items = ref<Array<Item>>([])
  const itemIndex = ref(-1)

  const errors = ref<Array<{ [key: string]: unknown }>>([])

  // Getters
  const getItems = () => items.value
  const getItemIndex = () => itemIndex.value
  const getItemsLength = () => items.value.length
  const getItemAt = (index: number) => items.value[ index ]

  const getErrors = () => errors.value

  // Mutations
  const setItems = (itemsToSet: Array<Item>) => {
    items.value = itemsToSet
    itemIndex.value = -1
  }
  const clearItems = () => {
    items.value = []
    itemIndex.value = -1
  }
  const setItemIndex = (val: number) => (itemIndex.value = val)
  const setCurrentItemIndex = (val: number) => (itemIndex.value = val)

  const addError = ({ actionName, error }: { actionName: string; error: unknown }) => {
    errors.value.push({
      [ actionName ]: error,
    })
    // eslint-disable-next-line no-console
    console.error(actionName, error)
  }

  // #region Actions
  async function fetchNextItem (): Promise<Item> {
    let item: Item | undefined

    const onError = (e: unknown) => {
      const error = buildError(e)
      addError({
        actionName: 'PLAYER_A_FETCH_NEXT',
        error,
      })
      return error
    }

    try {
      let index: number
      let items: Array<Item> = []
      let itemIndex: number = -1

      items = getItems()
      itemIndex = getItemIndex()

      if (!items.length) {
        throw onError('Items are empty.')
      }

      if (playerOptsStore.isFetchItemRandomly.value) {
        const obj = getRandomElementWithIndex(items)
        item = obj.el
        index = obj.index
      } else {
        index = itemIndex + 1
        if (index >= items.length) {
          index = 0
        }
        item = items[ index ]
      }

    } catch (e) {
      throw onError(e)
    }

    if (!item) {
      throw onError('No item found.')
    }

    return item
  }

  async function fetchPreviousItem () {
    let item: Item

    const onError = (e: unknown) => {
      const error = buildError(e)
      addError({
        actionName: 'PLAYER_A_FETCH_PREV',
        error,
      })
      return error
    }

    try {
      let index: number
      let items: Array<Item> = []
      let itemIndex: number = -1

      items = getItems()
      itemIndex = getItemIndex()

      if (items.length) {
        throw onError('Items are empty.')
      }

      index = itemIndex - 1
      if (index < 0) {
        index = items.length - 1
      }

      item = items[ index ]

    } catch (e) {
      throw onError(e)
    }

    if (!item) {
      throw onError('No item found.')
    }

    return item
  }

  async function fetchItemsFromDB () {
    let items: Array<Item>

    const tags = sourceOptsStore.tags.value
    const tagsOperator = sourceOptsStore.tagsOperator.value
    const fileTypes = sourceOptsStore.fileTypes.value

    try {
      items = await fetchItemsFromBddAPI({
        tags: Array.from(tags),
        tagsOperator,
        types: fileTypes,
      })

      setItems(items)
    } catch (e) {
      const error = buildError(e)
      addError({
        actionName: 'PLAYER_A_FETCH_ITEMS_FROM_BDD',
        error,
      })
      throw error
    }

    return items
  }
  // #endregion Actions

  return {
    // Getters
    getItems,
    getItemIndex,
    getItemsLength,
    getItemAt,

    getErrors,

    // Mutations
    setItems,
    clearItems,
    setItemIndex,
    setCurrentItemIndex,
    addError,

    // Actions
    fetchNextItem,
    fetchPreviousItem,
  }
})
