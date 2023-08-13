// Types
import type { Item } from '@/models/item'
import { PlayerName, type UsePlayerArg, type UsePlayerExpose } from '@/logic/ThePlayer/useThePlayer'

// Vendors Libs
import { computed } from 'vue'

// Libs
import { useTheLoop } from '@/logic/ThePlayer/useTheLoop'
import { getNextItem, getPreviousItem } from '@/utils/playerUtils'

// Stores
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptionsStore'
import { useTheLoopStore } from '@/stores/ThePlayer/TheLoopStore'
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { useHistoryPlayerStore } from '@/stores/ThePlayer/players/historyPlayerStore'
import { useDBPlayerStore } from '@/stores/ThePlayer/players/dbPlayerStore'
import {
  ON_DB_PLAYER_STORE_AFTER_DELETE_ITEM,
  ON_THE_PLAYER_STOP,
  emitter,
} from '@/logic/useEmitter'
import { createCustomError, type CustomError, type CustomErrorData } from '@/models/customError'
import { logError } from '@/utils/errorUtils'

export const useDBPlayer = ({
  showNextItem,
  setNextItem,
  getItemDuration,
}: UsePlayerArg) => {

  // Use stores.
  const thePlayerStore = useThePlayerStore()
  const playerOptsStore = usePlayerOptionsStore()
  const theLoopStore = useTheLoopStore()
  const historyPlayerStore = useHistoryPlayerStore()

  const isFetchItemRandomly = playerOptsStore.isFetchItemRandomly

  const isActivePlayer = computed<boolean>(
    () => thePlayerStore.playerName.value === PlayerName.db,
  )

  const {
    isStopped,
    isPaused,
    isOnHold,

    items,
    item,
    itemIndex,
    nextItem,
    nextItemIndex,

    fetchItems,
    reset: resetStore,
  } = useDBPlayerStore()

  // #region Private Methods
  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    const customError = createCustomError(error, {
      ...errorData,
      file: 'players/useDBPlayer.ts',
    })
    logError(customError)

    return customError
  }

  function activatePlayerFeatures (): void {
    // Player's components/feature enabled/disabled
    thePlayerStore.theLoopEnabled.value = true
    thePlayerStore.itemsInfoEnabled.value = true
    thePlayerStore.historyEnabled.value = true
    thePlayerStore.pauseEnabled.value = true

    // Loop's components/feature enabled/disabled
    theLoopStore.showRemainingTime.value = true
  }

  function addEventsListeners (): void {
    removeEventsListeners()
    emitter.on(ON_DB_PLAYER_STORE_AFTER_DELETE_ITEM, onAfterDeleteItem)
    emitter.on(ON_THE_PLAYER_STOP, removeEventsListeners)
  }

  function removeEventsListeners (): void {
    emitter.off(ON_DB_PLAYER_STORE_AFTER_DELETE_ITEM, onAfterDeleteItem)
    emitter.off(ON_THE_PLAYER_STOP, removeEventsListeners)
  }

  function initPlayerStates (): void {
    thePlayerStore.itemsCount.value = items.value.length
    thePlayerStore.itemIndex.value = itemIndex.value
  }

  async function showItem (itemToShow: Item, itemIndexToShow: number): Promise<void> {
    try {
      setNextItem(itemToShow)
      await showNextItem()

      item.value = itemToShow
      itemIndex.value = itemIndexToShow

      thePlayerStore.item.value = item.value
      thePlayerStore.itemIndex.value = itemIndex.value

      theLoopStore.value.value = 0
      theLoopStore.maxValue.value = getItemDuration() || playerOptsStore.interval.value * 1000
      theLoopStore.indeterminate.value = false
    } catch (e) {
      throw onError(e, { actionName: 'showItem' })
    }
  }

  async function onLoopEnd (): Promise<void> {
    try {
      theLoopStore.indeterminate.value = true

      if (!nextItem.value) {
        return await next()
      }

      historyPlayerStore.add(nextItem.value)

      await showItem(nextItem.value, nextItemIndex.value)

      nextItem.value = undefined
      nextItemIndex.value = -1

      if (!thePlayerStore.isPaused.value) {
        theLoop.startLooping()
      }
    } catch (e) {
      throw onError(e, { actionName: 'onLoopEnd' })
    }
  }

  function onAfterDeleteItem (): void {
    // TODO: if no more items in the list, stop playing.

    if (isActivePlayer.value) {
      thePlayerStore.itemsCount.value = items.value.length
      thePlayerStore.itemIndex.value = itemIndex.value

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
      theLoopStore.indeterminate.value = true
      isStopped.value = false

      items.value = await fetchItems()
      itemIndex.value = -1

      if (!items.value.length) {
        isStopped.value = true
        throw 'Fetch items from DB are empty.'
      }

      initPlayerStates()

      await onLoopEnd()
    } catch (e) {
      throw onError(e, { actionName: 'start' })
    }
  }

  function stop (): void {
    isStopped.value = true
    theLoopStore.indeterminate.value = false
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
    try {
      const { itm, index } = getNextItem({ items, itemIndex, isFetchItemRandomly })
      nextItem.value = itm
      nextItemIndex.value = index

      if (!nextItem.value) {
        isStopped.value = true
        throw 'No next item found.'
      }

      await theLoop.stopLooping()
      await onLoopEnd()

    } catch (e) {
      throw onError(e, { actionName: 'next' })
    }
  }

  async function previous (): Promise<void> {
    try {
      const { itm, index } = getPreviousItem({ items, itemIndex })
      nextItem.value = itm
      nextItemIndex.value = index

      if (!nextItem.value) {
        isStopped.value = true
        throw 'No previous item found.'
      }

      await theLoop.stopLooping()
      await onLoopEnd()

    } catch (e) {
      throw onError(e, { actionName: 'previous' })
    }
  }

  function canNext (): boolean { return true }
  function canPrevious (): boolean {
    return !isFetchItemRandomly.value
  }

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
      initPlayerStates()

      if (item.value) {
        await showItem(item.value, itemIndex.value)
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
