// Types
import type { Item } from '@/models/item'
import {
  PlayerName,
  type UsePlayerArg,
  type UsePlayerExpose,
} from '@/logic/ThePlayer/useThePlayer'

// Vendors Libs
import { computed, ref } from 'vue'

// Libs
import {
  ON_FS_PLAYER_STORE_AFTER_DELETE_ITEM,
  ON_THE_PLAYER_EXIT,
  emitter,
} from '@/logic/useEmitter'
import { useTheLoop } from '@/logic/ThePlayer/useTheLoop'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { useTheLoopStore } from '@/stores/ThePlayer/TheLoopStore'
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptionsStore'
import { useHistoryPlayerStore } from '@/stores/ThePlayer/players/historyPlayerStore'
import { useFSPlayerStore } from '@/stores/ThePlayer/players/fsPlayerStore'
import { CustomError, createCustomError, type CustomErrorData } from '@/models/customError'
import { logError } from '@/utils/errorUtils'

export const useFSPlayer = ({
  showNextItem,
  setNextItem,
  getItemDuration,
}: UsePlayerArg) => {

  const thePlayerStore = useThePlayerStore()
  const playerOptsStore = usePlayerOptionsStore()
  const theLoopStore = useTheLoopStore()
  const historyPlayerStore = useHistoryPlayerStore()

  const isActivePlayer = computed<boolean>(
    () => thePlayerStore.playerName.value === PlayerName.fs,
  )

  const shouldAnimateItem = ref(true)

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
    const customError = createCustomError(error, {
      ...errorData,
      file: 'players/useFSPlayer.ts',
    })
    logError(customError)

    return customError
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
    emitter.on(ON_THE_PLAYER_EXIT, removeEventsListeners)
  }

  function removeEventsListeners (): void {
    emitter.off(ON_FS_PLAYER_STORE_AFTER_DELETE_ITEM, onAfterDeleteItem)
    emitter.off(ON_THE_PLAYER_EXIT, removeEventsListeners)
  }

  async function showItem (itemToShow: Item): Promise<void> {
    try {
      setNextItem(itemToShow)
      await showNextItem({ animate: shouldAnimateItem.value })

      shouldAnimateItem.value = true

      item.value = itemToShow
      thePlayerStore.item.value = item.value

      theLoopStore.value.value = 0
      theLoopStore.maxValue.value = getItemDuration() || playerOptsStore.interval.value * 1000
      theLoopStore.indeterminate.value = false
    } catch (e) {
      throw onError(e, { actionName: 'showItem' })
    }
  }

  async function fetchNextItem (): Promise<Item> {
    try {
      isFetchingNextItem.value = true

      fetchNextItemPromise.value = fetchItem()
      const itm: Item = await fetchNextItemPromise.value

      fetchNextItemPromise.value = undefined
      isFetchingNextItem.value = false

      return itm
    } catch (e) {
      throw onError(e, { actionName: 'fetchNextItem' })
    }
  }

  async function onLoopEnd (): Promise<void> {
    try {
      theLoopStore.indeterminate.value = true

      if (isFetchingNextItem.value) {
        await fetchNextItemPromise.value

      } else if (!nextItem.value) {
        nextItem.value = await fetchNextItem()
      }

      if (!nextItem.value) {
        stop()
        throw 'No next item found.'
      }

      historyPlayerStore.add(nextItem.value)

      await showItem(nextItem.value)

      fetchNextItem()
        .then((itm) => nextItem.value = itm)

      if (!thePlayerStore.isPaused.value) {
        theLoop.startLooping()
      }
    } catch (e) {
      throw onError(e, { actionName: 'onLoopEnd' })
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
    try {
      addEventsListeners()
      reset()
      isStopped.value = false

      await onLoopEnd()

    } catch (e) {
      throw onError(e, { actionName: 'start' })
    }
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

  async function next ({ animate = true }: { animate?: boolean } = {}): Promise<void> {
    try {
      await theLoop.stopLooping()

      shouldAnimateItem.value = animate

      await onLoopEnd()
    } catch (e) {
      throw onError(e, { actionName: 'next' })
    }
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
    try {
      isOnHold.value = false
      activatePlayerFeatures()

      if (item.value) {
        await showItem(item.value)
      }
    } catch (e) {
      throw onError(e, { actionName: 'leaveOnHoldAndResume' })
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
