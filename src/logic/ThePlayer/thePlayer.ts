// TODO: Feature: Add fetch items from bdd with tags and types. DONE ?
// TODO: Bug: Backend: getimagesize raize warning in call response body that
//            trigger json.parse to fail. Should be added to the response object as error.

// Types
import type { Ref, ComputedRef } from 'vue'
import type { Item } from '@/models/item'

// Vendors Libs
import { computed, ref } from 'vue'

import { getRandomElementWithIndex } from '@/utils/utils'
import { buildError } from '@/api/api'
import {
  fetchRandomItem as fetchRandomItemAPI,
} from '@/api/items'
// import { Item as ItemClass } from '@/models/item'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayer'
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptions'

// Players
import { useFSPlayer } from '@/logic/ThePlayer/players/fsPlayer'
// import { usePinedPlayerStore } from '@/stores/ThePlayer/players/pinedPlayer'

export interface UsePlayerArg {
  setNextItem: (item: Item) => void
  showNextItem: () => void
  getItemDuration: () => number
  playItem: () => void
  pauseItem: () => void
}

export interface UsePlayerExpose {
  isStopped: ComputedRef<boolean>
  isPaused: ComputedRef<boolean>

  items?: Array<Item>
  item: ComputedRef<Item | undefined>
  itemIndex?: ComputedRef<number>

  start: () => Promise<void>
  stop: () => void
  pause: () => void
  resume: () => void
  next: () => Promise<void>
  previous: () => Promise<void>
  canNext: () => boolean
  canPrevious: () => boolean
  reset: () => void

  addItem?: (item: Item) => void
  removeItem?: (index: number) => void
}

interface UseThePlayer {
  setNextItem: (item: Item) => void
  showNextItem: () => void
  getItemDuration: () => number
  playItem: () => void
  pauseItem: () => void
}

export const useThePlayer = ({
  setNextItem,
  showNextItem,
  getItemDuration,
  playItem,
  pauseItem,
}: UseThePlayer) => {

  const {
    isPaused,
    isStopped,
  } = useThePlayerStore()

  const playerOptsStore = usePlayerOptionsStore()
  const sourceOptsStore = useSourceOptionsStore()


  const player = computed<UsePlayerExpose>(() => {
    // let player

    // if (sourceOptionsStore.isFromPined) {
    // player = useFSPlayerStore()
    // }

    return useFSPlayer({
      setNextItem,
      showNextItem,
      getItemDuration,
      playItem,
      pauseItem,
    })

    // if (isFromPinedsSource.value) {
    //   await playerStore.fetchItemsFromPineds()
    // } else if (hasTagsSource.value || hasFileTypesSource) {
    //   setLoopIndeterminate(true)

    //   try {
    //     await playerStore.fetchItemsFromDB()
    //   } catch (e) {
    //     const error = buildError(e)

    //     setLoopIndeterminate(false)
    //     displayAlert({ ...error, onClose: stopPlaying })

    //     if (error.severity === ERROR_SEVERITY_INFO) {
    //       return Promise.resolve()
    //     }

    //     throw error
    //   }
    // } else {
    //   await playerStore.fetchItemsFromFS()
    // }
  })

  // #region Actions
  const start = () => {
    player.value.start()

    isStopped.value = false
  }

  const pause = () => {
    player.value.pause()

    isPaused.value = true
  }

  const resume = () => {
    player.value.resume()

    isPaused.value = false
  }

  const stop = () => {
    player.value.stop()

    isStopped.value = true
  }

  const next = async () => player.value.next()

  const previous = async () => player.value.previous()

  const reset = () => {
    player.value.reset()
  }
  // #endregion Actions

  return {
    player,

    start,
    stop,
    pause,
    resume,
    next,
    previous,
    reset,
  }
}
