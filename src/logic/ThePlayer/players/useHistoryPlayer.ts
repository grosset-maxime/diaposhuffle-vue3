// Types
import type { Item } from '@/models/item'
import { PlayerName, type UsePlayerArg, type UsePlayerExpose } from '@/logic/ThePlayer/useThePlayer'

// Vendors Libs
import { computed } from 'vue'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { useHistoryPlayerStore } from '@/stores/ThePlayer/players/historyPlayerStore'
import { getNextItem, getPreviousItem } from '@/utils/playerUtils'
import {
  ON_HISTORY_PLAYER_STORE_AFTER_DELETE_ITEM,
  ON_THE_PLAYER_STOP,
  emitter,
} from '@/logic/useEmitter'
import { createCustomError, type CustomError, type CustomErrorData } from '@/models/customError'
import { logError } from '@/utils/errorUtils'

export const useHistoryPlayer = ({
  showNextItem,
  setNextItem,
}: UsePlayerArg) => {

  const thePlayerStore = useThePlayerStore()

  const isActivePlayer = computed<boolean>(
    () => thePlayerStore.playerName.value === PlayerName.history,
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
  } = useHistoryPlayerStore()

  // #region Private Methods
  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    const customError = createCustomError(error, {
      ...errorData,
      file: 'players/useHistoryPlayer.ts',
    })
    logError(customError)

    return customError
  }

  function activatePlayerFeatures (): void {
    // Player's components/feature enabled/disabled
    thePlayerStore.itemsInfoEnabled.value = true
  }

  function addEventsListeners (): void {
    removeEventsListeners()
    emitter.on(ON_HISTORY_PLAYER_STORE_AFTER_DELETE_ITEM, onAfterDeleteItem)
    emitter.on(ON_THE_PLAYER_STOP, removeEventsListeners)
  }

  function removeEventsListeners (): void {
    emitter.off(ON_HISTORY_PLAYER_STORE_AFTER_DELETE_ITEM, onAfterDeleteItem)
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
    } catch (e) {
      throw onError(e, { actionName: 'showItem' })
    }
  }

  async function onEnd (): Promise<void> {
    try {
      if (!nextItem.value) {
        return await next()
      }

      await showItem(nextItem.value, nextItemIndex.value)

      nextItem.value = undefined
      nextItemIndex.value = -1
    } catch (e) {
      throw onError(e, { actionName: 'onEnd' })
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

  // #region Exposed Actions
  async function start (): Promise<void> {
    try {
      addEventsListeners()

      reset()
      isStopped.value = false

      itemIndex.value = 0
      initPlayerStates()

      if (!items.value.length) {
        throw 'History items are empty.'
      }

      await previous()
    } catch (e) {
      throw onError(e, { actionName: 'start' })
    }
  }

  function stop (): void {
    isStopped.value = true
    removeEventsListeners()
  }

  function pause (): void {}

  function resume (): void {}

  async function next (): Promise<void> {
    try {
      const { itm, index } = getNextItem({ items, itemIndex })
      nextItem.value = itm
      nextItemIndex.value = index

      if (!nextItem.value) {
        isStopped.value = true
        throw 'No next item found.'
      }

      await onEnd()
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

      await onEnd()
    } catch (e) {
      throw onError(e, { actionName: 'previous' })
    }
  }

  function canNext (): boolean { return true }
  function canPrevious (): boolean { return true }

  function canPause (): boolean { return false }
  function canResume (): boolean { return false }

  function setOnHold (): void {
    isOnHold.value = true
  }

  async function leaveOnHoldAndResume (): Promise<void> {
    try {
      isOnHold.value = false
      activatePlayerFeatures()
      initPlayerStates()

      itemIndex.value = items.value.length - 1
      thePlayerStore.itemIndex.value = itemIndex.value
    } catch (e) {
      throw onError(e, { actionName: 'leaveOnHoldAndResume' })
    }
  }

  function reset (): void {
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
