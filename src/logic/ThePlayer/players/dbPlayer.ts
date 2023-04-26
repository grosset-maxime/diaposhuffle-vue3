// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { ref, computed } from 'vue'

import { getRandomElementWithIndex } from '@/utils/utils'
import { buildError } from '@/api/api'
import {
  fetchItemsFromBdd as fetchItemsFromBddAPI,
} from '@/api/items'
// import { Item as ItemClass } from '@/models/item'

// Stores
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptions'
import type { UsePlayerArg, UsePlayerExpose } from '../thePlayer'
import { useTheLoop } from '../theLoop'
import { useTheLoopStore } from '@/stores/ThePlayer/TheLoopStore'
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'

export const useDBPlayer = ({
  showNextItem,
  setNextItem,
  getItemDuration,
}: UsePlayerArg) => {
  const thePlayerStore = useThePlayerStore()
  const playerOptsStore = usePlayerOptionsStore()
  const sourceOptsStore = useSourceOptionsStore()
  const theLoopStore = useTheLoopStore()

  const isStopped = ref(true)
  const isPaused = ref(false)

  const isFetchItemRandomly = computed(() => playerOptsStore.isFetchItemRandomly.value)

  const items = ref<Array<Item>>([])
  const item = ref<Item | undefined>()
  const itemIndex = ref<number>(-1)

  const nextItem = ref<Item | undefined>()
  const nextItemIndex = ref<number>(NaN)

  // State
  const errors = ref<Array<{ [key: string]: unknown }>>([])

  // #region Methods
  function addError ({ actionName, error }: { actionName: string; error: unknown }): void {
    errors.value.push({
      [ actionName ]: error,
    })
    console.error(actionName, error)
  }

  const onError = (e: unknown) => {
    const error = buildError(e)
    addError({
      actionName: 'PLAYER_A_FETCH_PREV',
      error,
    })
    return error
  }

  async function fetchItems (): Promise<Array<Item>> {
    try {
      const items = await fetchItemsFromBddAPI({
        tags: Array.from(sourceOptsStore.tags.value),
        tagsOperator: sourceOptsStore.tagsOperator.value,
        types: sourceOptsStore.fileTypes.value,
      })

      return items

    } catch (e) {
      const error = buildError(e)
      addError({
        actionName: 'PLAYER_A_FETCH_ITEMS_FROM_BDD',
        error,
      })
      throw error
    }
  }

  function getRandomItem (): { itm: Item, index: number } {
    const { el: itm, index } = getRandomElementWithIndex(items.value)

    if (!itm) { throw new Error('No random item found.') }

    return { itm, index }
  }

  function getNextItem (): { itm: Item, index: number } {
    if (isFetchItemRandomly.value) {
      return getRandomItem()
    }

    let index = itemIndex.value + 1

    if (index >= items.value.length) { // TODO: do it if itemsLoopFeature enabled.
      index = 0
    }

    const itm = items.value[ index ]

    if (!itm) { throw new Error('No next item found.') }

    return { itm, index }
  }

  function getPreviousItem (): { itm: Item, index: number } {
    let index = itemIndex.value - 1

    if (index < 0) { // TODO: do it if itemsLoopFeature enabled.
      index = items.value.length - 1
    }

    const itm = items.value[ index ]

    if (!itm) { throw new Error('No next item found.') }

    return { itm, index }
  }

  async function onLoopEnd (): Promise<void> {
    theLoopStore.indeterminate.value = true

    if (!nextItem.value) {
      const { itm, index } = getNextItem()
      nextItem.value = itm
      nextItemIndex.value = index
    }

    if (!nextItem.value) { throw new Error('No next item found.') }

    setNextItem(nextItem.value)
    await showNextItem()

    item.value = nextItem.value
    itemIndex.value = nextItemIndex.value

    thePlayerStore.item.value = item.value
    thePlayerStore.itemIndex.value = itemIndex.value

    theLoopStore.value.value = 0
    theLoopStore.maxValue.value = getItemDuration() || playerOptsStore.interval.value * 1000
    theLoopStore.indeterminate.value = false

    nextItem.value = undefined
    nextItemIndex.value = -1

    if (!isPaused.value) {
      theLoop.startLooping()
    }
  }

  const theLoop = useTheLoop({ endFn: onLoopEnd })
  // #endregion Methods

  // #region Exposed Actions
  async function start (): Promise<void> {
    reset()

    theLoopStore.indeterminate.value = true
    isStopped.value = false

    items.value = await fetchItems()
    thePlayerStore.itemsCount.value = items.value.length

    if (!items.value.length) {
      throw onError('Items are empty.')
    }

    await onLoopEnd()
  }

  function stop (): void {
    isStopped.value = true
    theLoop.stopLooping()
  }

  function pause (): void {
    isPaused.value = true
    theLoop.pauseLooping()
    thePlayerStore.isPaused.value = true
  }

  function resume (): void {
    isPaused.value = false
    theLoop.resumeLooping()
    thePlayerStore.isPaused.value = false
  }

  async function next (): Promise<void> {
    const { itm, index } = getNextItem()
    nextItem.value = itm
    nextItemIndex.value = index

    await theLoop.stopLooping()
    await onLoopEnd()
  }

  async function previous (): Promise<void> {
    const { itm, index } = getPreviousItem()
    nextItem.value = itm
    nextItemIndex.value = index

    await theLoop.stopLooping()
    await onLoopEnd()
  }

  function canNext (): boolean { return true }
  function canPrevious (): boolean {
    return !isFetchItemRandomly.value
  }

  const reset = (): void => {
    isStopped.value = true
    isPaused.value = false

    items.value = []
    itemIndex.value = -1
    item.value = undefined
    nextItem.value = undefined
    nextItemIndex.value = -1

    theLoopStore.reset()
    theLoopStore.enabled.value = true
    theLoopStore.showRemainingTime.value = true

    thePlayerStore.reset()
    // Player's components/feature enabled/disabled
    thePlayerStore.itemsInfoEnabled.value = true

    errors.value = []
  }
  // #endregion Exposed Actions

  const player: UsePlayerExpose = {
    isStopped: computed(() => isStopped.value),
    isPaused: computed(() => isPaused.value),

    item: computed(() => item.value),

    start,
    stop,
    pause,
    resume,
    next,
    previous,
    canNext,
    canPrevious,
    reset,
  }

  return player
}
