// Types
import type { Item } from '@/models/item'
import type {
  UsePlayerArg,
  UsePlayerExpose,
} from '@/logic/ThePlayer/thePlayer'
import type { CustomError, CustomErrorData } from '@/models/error'

// Vendors Libs
import { computed } from 'vue'

// Libs
import { useTheLoop } from '@/logic/ThePlayer/theLoop'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { useTheLoopStore } from '@/stores/ThePlayer/TheLoopStore'
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'
import { useHistoryPlayerStore } from '@/stores/ThePlayer/players/historyPlayerStore'
import { useErrorStore } from '@/stores/errorStore'
import { useFSPlayerStore } from '@/stores/ThePlayer/players/fsPlayerStore'

export const useFSPlayer = ({
  showNextItem,
  setNextItem,
  getItemDuration,
}: UsePlayerArg) => {

  const thePlayerStore = useThePlayerStore()
  const playerOptsStore = usePlayerOptionsStore()
  const theLoopStore = useTheLoopStore()
  const historyPlayerStore = useHistoryPlayerStore()
  const errorStore = useErrorStore()

  const {
    isStopped,
    isPaused,

    item,
    nextItem,
    fetchNextItemPromise,
    isFetchingNextItem,

    reset: resetStore,
    fetchItem,
  } = useFSPlayerStore()

  // #region Methods
  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    return errorStore.add(error, {
      ...errorData,
      file: 'fsPlayer.ts',
      actionName: 'PLAYER_A_FETCH_PREV',
    })
  }

  async function fetchNextItem (): Promise<Item> {
    isFetchingNextItem.value = true

    fetchNextItemPromise.value = fetchItem()
    const itm: Item = await fetchNextItemPromise.value

    fetchNextItemPromise.value = undefined
    isFetchingNextItem.value = false

    return itm
  }

  async function onLoopEnd (): Promise<void> {
    theLoopStore.indeterminate.value = true

    if (isFetchingNextItem.value) {
      await fetchNextItemPromise.value

    } else if (!nextItem.value) {
      nextItem.value = await fetchNextItem()
    }

    if (!nextItem.value) {
      stop()
      throw onError('No next item found.')
    }

    historyPlayerStore.add(nextItem.value)

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

    if (!thePlayerStore.isPaused.value) {
      theLoop.startLooping()
    }
  }
  // #endregion Methods

  const theLoop = useTheLoop({ endFn: onLoopEnd })

  // #region Exposed Actions
  async function start (): Promise<void> {
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

  function canPause (): boolean { return true }
  function canResume (): boolean { return true }

  function reset (): void {
    resetStore()

    // Loop's components/feature enabled/disabled
    theLoopStore.enabled.value = true
    theLoopStore.showRemainingTime.value = true

    // Player's components/feature enabled/disabled
    thePlayerStore.historyEnabled.value = true
    thePlayerStore.pauseEnabled.value = true
  }

  async function onDeleteItem (itm: Item): Promise<void> {
    if (isFetchingNextItem.value) {
      await fetchNextItemPromise.value
    }

    if (nextItem.value && itm.src === nextItem.value.src) {
      nextItem.value = undefined
    }

    next()
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

    onDeleteItem,
  }

  return player
}
