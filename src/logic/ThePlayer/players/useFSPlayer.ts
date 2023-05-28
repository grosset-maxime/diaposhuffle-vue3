// Types
import type { Item } from '@/models/item'
import {
  PlayerName,
  type UsePlayerArg,
  type UsePlayerExpose,
} from '@/logic/ThePlayer/useThePlayer'
import type { CustomError, CustomErrorData } from '@/models/error'

// Vendors Libs
import { computed } from 'vue'

// Libs
import {
  ON_FS_PLAYER_STORE_AFTER_DELETE_ITEM,
  ON_THE_PLAYER_STOP,
  emitter,
} from '@/logic/useEmitter'
import { useTheLoop } from '@/logic/ThePlayer/useTheLoop'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { useTheLoopStore } from '@/stores/ThePlayer/TheLoopStore'
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptionsStore'
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

  const isActivePlayer = computed<boolean>(
    () => thePlayerStore.playerName.value === PlayerName.fs,
  )

  const {
    isStopped,
    isPaused,
    isOnHold,

    item,
    nextItem,
    fetchNextItemPromise,
    isFetchingNextItem,

    reset: resetStore,
    fetchItem,
  } = useFSPlayerStore()

  // #region Private Methods
  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    return errorStore.add(error, {
      ...errorData,
      file: 'useFSPlayer.ts',
    })
  }

  function activatePlayerFeatures (): void {
    // Player's components/feature enabled/disabled
    thePlayerStore.theLoopEnabled.value = true
    thePlayerStore.historyEnabled.value = true
    thePlayerStore.pauseEnabled.value = true

    // Loop's components/feature enabled/disabled
    theLoopStore.showRemainingTime.value = true
  }

  function addEventsListeners (): void {
    removeEventsListeners()
    emitter.on(ON_FS_PLAYER_STORE_AFTER_DELETE_ITEM, onAfterDeleteItem)
    emitter.on(ON_THE_PLAYER_STOP, removeEventsListeners)
  }

  function removeEventsListeners (): void {
    emitter.off(ON_FS_PLAYER_STORE_AFTER_DELETE_ITEM, onAfterDeleteItem)
    emitter.off(ON_THE_PLAYER_STOP, removeEventsListeners)
  }

  async function showItem (itemToShow: Item): Promise<void> {
    setNextItem(itemToShow)
    await showNextItem()

    item.value = itemToShow
    thePlayerStore.item.value = item.value

    theLoopStore.value.value = 0
    theLoopStore.maxValue.value = getItemDuration() || playerOptsStore.interval.value * 1000
    theLoopStore.indeterminate.value = false
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

    await showItem(nextItem.value)

    fetchNextItem()
      .then((itm) => nextItem.value = itm)

    if (!thePlayerStore.isPaused.value) {
      theLoop.startLooping()
    }
  }

  async function onAfterDeleteItem (): Promise<void> {
    if (isActivePlayer.value) {
      next()
    }
  }
  // #endregion Private Methods

  const theLoop = useTheLoop({ endFn: onLoopEnd })

  // #region Exposed Actions
  async function start (): Promise<void> {
    addEventsListeners()
    reset()
    isStopped.value = false
    await onLoopEnd()
  }

  function stop (): void {
    isStopped.value = true
    theLoop.stopLooping()
    removeEventsListeners()
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

  function setOnHold (): void {
    pause()
    isOnHold.value = true
  }

  async function leaveOnHoldAndResume (): Promise<void> {
    isOnHold.value = false
    activatePlayerFeatures()

    if (item.value) {
      await showItem(item.value)
    }
  }

  function reset (): void {
    resetStore()
    activatePlayerFeatures()
  }
  // #endregion Exposed Actions

  const player: UsePlayerExpose = {
    isStopped: computed<boolean>(() => isStopped.value),
    isPaused: computed<boolean>(() => isPaused.value),
    isOnHold: computed<boolean>(() => isOnHold.value),

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

    setOnHold,
    leaveOnHoldAndResume,
    reset,
  }

  return player
}
