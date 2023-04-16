// Types
import type { Ref } from 'vue'
import type { Item } from '@/models/item'
import type { Player } from '@/stores/ThePlayer/ThePlayer'

// Vendors Libs
import { ref, reactive, computed } from 'vue'
import { createGlobalState } from '@vueuse/core'

import { getRandomElementWithIndex } from '@/utils/utils'
import { buildError } from '@/api/api'
import { Item as ItemClass } from '@/models/item'

// Stores
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'
// import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptions'

export const usePinedPlayerStore = createGlobalState(() => {
  const playerOptsStore = usePlayerOptionsStore()
  // const sourceOptsStore = useSourceOptionsStore()

  const isStopped = ref(true)
  const isPlaying = ref(false)

  const isFetching = ref(false)
  const isFetchingNext = ref(false)
  const isFetchingPrevious = ref(false)

  const items = reactive<Array<Item>>([])

  const item: Ref<Item | undefined> = ref()
  const itemIndex = ref(-1)

  const nextItem: Ref<Item | undefined> = ref()
  const nextItemIndex = ref(-1)

  const previousItem: Ref<Item | undefined> = ref()
  const previousItemIndex = ref(-1)

  const dir = ref()

  const errors = ref<Array<{ [key: string]: unknown }>>([])

  // const getPinedItemIndex = (itemSrc: string | Item) => {
  //   const src = itemSrc instanceof ItemClass
  //     ? itemSrc.src
  //     : itemSrc
  //   return pinedItems.value.findIndex((item: Item) => item.src === src)
  // }

  // const getErrors = () => errors.value
  const addError = ({ actionName, error }: { actionName: string; error: unknown }) => {
    errors.value.push({
      [ actionName ]: error,
    })
    console.error(actionName, error)
  }

  // #region Mandatory Actions
  const start = async () => {
    isStopped.value = false
  }

  const stop = () => {
    isStopped.value = true
  }

  const play = () => {
    isPlaying.value = true
  }

  const pause = () => {
    isPlaying.value = false
  }

  const next = async () => {
    item.value = nextItem.value
    itemIndex.value = nextItemIndex.value

    computeNextItem()
    computePreviousItem()
  }

  const previous = async () => {
    item.value = previousItem.value
    itemIndex.value = previousItemIndex.value

    computePreviousItem()
    computeNextItem()
  }

  const reset = () => {
    isStopped.value = true
    isPlaying.value = false

    isFetching.value = false
    isFetchingNext.value = false
    isFetchingPrevious.value = false

    items.length = 0

    item.value = undefined
    itemIndex.value = -1

    nextItem.value = undefined
    previousItem.value = undefined

    errors.value = []
  }
  // #endregion Mandatory Actions

  // #region Optionnal Actions
  const addItem = (item: Item) => { items.push(item) }
  const removeItem = (index: number) => { items.splice(index, 1) }
  // #enregion Optionnal Actions

  // #region Methods
  const computeNextItem = () => {

  }
  const computePreviousItem = () => {

  }
  // #endregion Methods

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
    let item: Item | undefined

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

  function fetchItemsFromPineds () {
    // setCurrentItemIndex(-1)
    return Promise.resolve()
  }

  const player: Player = {
    isStopped: computed(() => isStopped.value),
    isPlaying: computed(() => isPlaying.value),

    isFetching: computed(() => isFetching.value),
    isFetchingNext: computed(() => isFetchingNext.value),
    isFetchingPrevious: computed(() => isFetchingPrevious.value),

    items,

    item: computed(() => item.value),
    itemIndex: computed(() => itemIndex.value),

    nextItem: computed(() => nextItem.value),
    previousItem: computed(() => previousItem.value),

    start,
    stop,
    play,
    pause,
    next,
    previous,
    reset,

    addItem,
    removeItem,
  }

  return player
})
