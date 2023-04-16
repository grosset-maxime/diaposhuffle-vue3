// TODO: Feature: Add fetch items from bdd with tags and types. DONE ?
// TODO: Bug: Backend: getimagesize raize warning in call response body that
//            trigger json.parse to fail. Should be added to the response object as error.

// Types
import type { Ref } from 'vue'
import type { Item } from '@/models/item'
import type { UsePlayerArg, UsePlayerExpose } from '@/logic/ThePlayer/thePlayer'

// Vendors Libs
import { ref, computed, reactive } from 'vue'

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

export const useFSPlayer = ({
  showNextItem,
  setNextItem,
  playItem,
}: UsePlayerArg) => {

  const thePlayerStore = useThePlayerStore()
  // const playerOptsStore = usePlayerOptionsStore()
  const sourceOptsStore = useSourceOptionsStore()
  const theLoopStore = useTheLoopStore()

  const theLoop = useTheLoop()

  const isStopped = ref(true)
  const isPlaying = ref(false)

  const isFetching = ref(false)
  const isFetchingNext = ref(false)

  const item = ref<Item | undefined>()
  const fetchItemPromise = ref<Promise<Item> | undefined>()

  const nextItem = ref<Item | undefined>()
  const fetchNextItemPromise = ref<Promise<Item> | undefined>()

  const errors = ref<Array<{ [key: string]: unknown }>>([])

  // const getErrors = () => errors.value

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
  const start = async () => {
    reset()

    isStopped.value = false
    theLoopStore.indeterminate.value = true

    isFetching.value = true
    fetchItemPromise.value = fetchItem()
    fetchItemPromise.value.then(async (itm) => {
      item.value = itm
      isFetching.value = false

      setNextItem(itm)
      await showNextItem()

      thePlayerStore.item.value = itm
      play()
    })

    isFetchingNext.value = true
    fetchNextItemPromise.value = fetchItem()
    fetchNextItemPromise.value.then(async (itm) => {
      await fetchItemPromise.value
      nextItem.value = itm
      isFetchingNext.value = false

      setNextItem(itm)
    })
  }

  const stop = () => {
    isStopped.value = true
  }

  const play = () => {
    isPlaying.value = true
    theLoopStore.indeterminate.value = false

    if (theLoop.isPaused.value) {
      theLoop.resumeLooping()
    } else {
      theLoop.startLooping()
    }
  }

  const pause = () => {
    isPlaying.value = false
  }

  const next = async () => {
    item.value = nextItem.value

    computeNextItem()
    computePreviousItem()
  }

  const previous = async () => {
  // item.value = previousItem.value

    computePreviousItem()
    computeNextItem()
  }

  const reset = () => {
    isStopped.value = true
    isPlaying.value = false

    isFetching.value = false
    isFetchingNext.value = false

    item.value = undefined

    nextItem.value = undefined

    theLoopStore.enabled.value = true
    theLoopStore.indeterminate.value = false
    theLoopStore.value.value = -1
    theLoopStore.maxValue.value = -1

    errors.value = []
  }
  // #endregion Exposed Actions

  const player: UsePlayerExpose = {
    isStopped: computed(() => isStopped.value),
    isPlaying: computed(() => isPlaying.value),
    isPaused: computed(() => !isPlaying.value),
    isFetching: computed(() => isFetching.value),

    item: computed(() => item.value),

    start,
    stop,
    play,
    pause,
    next,
    previous,
    reset,
  }

  return player
}
