// TODO: Feature: Add fetch items from bdd with tags and types. DONE ?
// TODO: Bug: Backend: getimagesize raize warning in call response body that
//            trigger json.parse to fail. Should be added to the response object as error.

// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

// import { getRandomElementWithIndex } from '@/utils/utils'
import { buildError } from '@/api/api'
import { Item as ItemClass } from '@/models/item'

// Stores
// import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'
// import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptions'

export const useThePlayerStore = createGlobalState(() => {
  // const playerOptsStore = usePlayerOptionsStore()
  // const sourceOptsStore = useSourceOptionsStore()

  // State
  const items = ref<Array<Item>>([])
  const itemIndex = ref(-1)

  // const historyItems = ref<Array<Item>>([])
  // const historyItemIndex = ref(0)

  const errors = ref<Array<{ [key: string]: unknown }>>([])

  // Getters
  const getItems = () => items.value
  const getItemIndex = () => itemIndex.value
  const getItemsLength = () => items.value.length
  const getItemAt = (index: number) => items.value[ index ]

  // const getHistoryItems = () => historyItems.value
  // const getHistoryLength = () => historyItems.value.length
  // const getHistoryItemAt = (index: number) => historyItems.value[ index ]
  // const getHistoryIndex = () => historyItemIndex.value

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

  // const setHistoryIndex = (val: number) => (historyItemIndex.value = val)
  // const addHistoryItem = (item: Item) => historyItems.value.push(item)
  // const setHistoryItemIndex = (index: number, item: Item) => (historyItems.value[ index ] = item)
  // const deleteHistoryItem = (itemSrc: string | Item) => {
  //   const src = itemSrc instanceof ItemClass
  //     ? itemSrc.src
  //     : itemSrc
  //   historyItemIndex.value -= 1
  //   historyItems.value = historyItems.value.filter((i: Item) => i.src !== src)
  // }

  const addError = ({ actionName, error }: { actionName: string; error: unknown }) => {
    errors.value.push({
      [ actionName ]: error,
    })
    // eslint-disable-next-line no-console
    console.error(actionName, error)
  }

  // Actions
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

    if (!item) {
      throw onError('No item found.')
    }

    return item
  }

  async function fetchPreviousItem () {
    let item: Item | undefined

    const onError = (e: unknown) => {
      const error = buildError(e)
      addError({
        actionName: 'PLAYER_A_FETCH_PREV',
        error,
      })
      return error
    }

    if (!item) {
      throw onError('No item found.')
    }

    return item
  }

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
