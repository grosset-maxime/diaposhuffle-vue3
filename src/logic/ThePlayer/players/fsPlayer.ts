// TODO: Feature: Add fetch items from bdd with tags and types. DONE ?
// TODO: Bug: Backend: getimagesize raize warning in call response body that
//            trigger json.parse to fail. Should be added to the response object as error.

// Types
import type { Ref } from 'vue'
import type { Item } from '@/models/item'
import type { UsePlayerArg, UsePlayerExpose } from '@/logic/ThePlayer/thePlayer'

// Vendors Libs
import { ref, computed, watch } from 'vue'

// import { getRandomElementWithIndex } from '@/utils/utils'
import { buildError } from '@/api/api'
import {
  fetchRandomItem as fetchRandomItemAPI,
} from '@/api/items'
import { Item as ItemClass } from '@/models/item'

import { useTheLoop } from '@/logic/ThePlayer/theLoop'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayer'
// import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptions'
import { useTheLoopStore } from '@/stores/ThePlayer/TheLoop'
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'

export const useFSPlayer = ({
  showNextItem,
  setNextItem,
  playItem,
  pauseItem,
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

  // const getErrors = () => errors.value

  async function fetchNextItem (): Promise<Item> {
    isFetchingNext.value = true

    fetchNextItemPromise.value = fetchItem()
    const itm = await fetchNextItemPromise.value

    nextItem.value = itm
    isFetchingNext.value = false
    return itm
  }

  async function onLoopEnd () {
    theLoopStore.indeterminate.value = true

    if (!nextItem.value) { await fetchNextItem() }
    if (!nextItem.value) { throw new Error('No next item found.') }

    setNextItem(nextItem.value)
    await showNextItem()

    item.value = nextItem.value
    thePlayerStore.item.value = item.value

    theLoopStore.indeterminate.value = false
    theLoopStore.value.value = 0
    // TODO: get video duration here
    theLoopStore.maxValue.value = playerOptsStore.interval.value * 1000

    fetchNextItem()

    if (!isPaused.value) {
      theLoop.startLooping()
    }
  }

  const theLoop = useTheLoop({ endFn: onLoopEnd })

  // #region Methods
  function addError ({ actionName, error }: { actionName: string; error: unknown }): void {
    errors.value.push({
      [ actionName ]: error,
    })
    console.error(actionName, error)
  }

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

    isFetchingNext.value = false

    item.value = undefined
    nextItem.value = undefined

    theLoopStore.enabled.value = true
    theLoopStore.indeterminate.value = false
    theLoopStore.value.value = NaN
    theLoopStore.maxValue.value = NaN

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
