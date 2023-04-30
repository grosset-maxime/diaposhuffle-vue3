// TODO: Bug: Manage unpin on playing pined items.

// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { ref, computed } from 'vue'

import { getRandomElementWithIndex } from '@/utils/utils'
import { buildError } from '@/api/api'

// Stores
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'
import type { UsePlayerArg, UsePlayerExpose } from '../thePlayer'
import { useTheLoop } from '../theLoop'
import { useTheLoopStore } from '@/stores/ThePlayer/TheLoopStore'
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { useThePinedStore } from '@/stores/ThePlayer/ThePinedStore'

export const usePinedPlayer = ({
  showNextItem,
  setNextItem,
  getItemDuration,
}: UsePlayerArg) => {
  const thePinedStore = useThePinedStore()
  const thePlayerStore = useThePlayerStore()
  const playerOptsStore = usePlayerOptionsStore()
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

    if (!thePlayerStore.isPaused.value) {
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

    items.value = thePinedStore.items.value
    itemIndex.value = -1

    thePlayerStore.itemsCount.value = items.value.length
    thePlayerStore.itemIndex.value = itemIndex.value

    if (!items.value.length) {
      throw onError('Pined items are empty.')
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

  function canPause (): boolean { return true }
  function canResume (): boolean { return true }

  const reset = (): void => {
    isStopped.value = true
    isPaused.value = false

    items.value = []
    itemIndex.value = NaN
    item.value = undefined
    nextItem.value = undefined
    nextItemIndex.value = NaN

    // Loop's components/feature enabled/disabled
    theLoopStore.enabled.value = true
    theLoopStore.showRemainingTime.value = true

    // Player's components/feature enabled/disabled
    thePlayerStore.itemsInfoEnabled.value = true
    thePlayerStore.pauseEnabled.value = true

    errors.value = []
  }
  // #endregion Exposed Actions

  const player: UsePlayerExpose = {
    isStopped: computed<boolean>(() => isStopped.value),
    isPaused: computed<boolean>(() => isPaused.value),

    start,
    stop,
    pause,
    resume,
    next,
    previous,
    canNext,
    canPrevious,
    canPause,
    canResume,
    reset,
  }

  return player
}
