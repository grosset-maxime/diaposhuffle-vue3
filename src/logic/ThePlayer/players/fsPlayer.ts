// Types
import type { Item } from '@/models/item'
import type { UsePlayerArg, UsePlayerExpose } from '@/logic/ThePlayer/thePlayer'

// Vendors Libs
import { ref, computed } from 'vue'

// import { getRandomElementWithIndex } from '@/utils/utils'
import { buildError } from '@/api/api'
import {
  fetchRandomItem as fetchRandomItemAPI,
} from '@/api/items'

import { useTheLoop } from '@/logic/ThePlayer/theLoop'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
// import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptions'
import { useTheLoopStore } from '@/stores/ThePlayer/TheLoopStore'
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'

export const useFSPlayer = ({
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

  const item = ref<Item | undefined>()

  const nextItem = ref<Item | undefined>()
  const fetchNextItemPromise = ref<Promise<Item> | undefined>()
  const isFetchingNext = ref(false)

  const errors = ref<Array<{ [key: string]: unknown }>>([])

  // #region Methods
  function addError ({ actionName, error }: { actionName: string; error: unknown }): void {
    errors.value.push({
      [ actionName ]: error,
    })
    console.error(actionName, error)
  }

  async function fetchNextItem (): Promise<Item> {
    isFetchingNext.value = true

    fetchNextItemPromise.value = fetchItem()
    const itm = await fetchNextItemPromise.value

    isFetchingNext.value = false
    return itm
  }

  async function onLoopEnd (): Promise<void> {
    theLoopStore.indeterminate.value = true

    if (!nextItem.value) {
      nextItem.value = await fetchNextItem()
    }

    if (!nextItem.value) { throw new Error('No next item found.') }

    setNextItem(nextItem.value)
    await showNextItem()

    const itm = nextItem.value
    item.value = itm
    thePlayerStore.item.value = itm

    theLoopStore.value.value = 0
    theLoopStore.maxValue.value = getItemDuration() || playerOptsStore.interval.value * 1000
    theLoopStore.indeterminate.value = false

    fetchNextItem()
      .then((itm) => nextItem.value = itm)

    if (!isPaused.value) {
      theLoop.startLooping()
    }
  }

  const theLoop = useTheLoop({ endFn: onLoopEnd })

  async function fetchItem (): Promise<Item> {
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

  // #region Exposed Actions
  async function start (): Promise<void> {
    reset()
    isStopped.value = false
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
    await theLoop.stopLooping()
    await onLoopEnd()
  }

  async function previous (): Promise<void> {}

  function canNext (): boolean { return true }
  function canPrevious (): boolean { return false }

  const reset = (): void => {
    isStopped.value = true
    isPaused.value = false

    item.value = undefined
    nextItem.value = undefined
    fetchNextItemPromise.value = undefined
    isFetchingNext.value = false

    theLoopStore.reset()
    theLoopStore.enabled.value = true
    theLoopStore.showRemainingTime.value = true

    thePlayerStore.reset()
    thePlayerStore.itemsInfoEnabled.value = false

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
