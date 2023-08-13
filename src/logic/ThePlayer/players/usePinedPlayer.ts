// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { computed } from 'vue'

// Stores
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptionsStore'
import { useTheLoopStore } from '@/stores/ThePlayer/TheLoopStore'
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { usePinedPlayerStore } from '@/stores/ThePlayer/players/pinedPlayerStore'

// Logics
import {
  ON_ITEM_UNPINED,
  ON_THE_PLAYER_STOP,
  emitter,
} from '@/logic/useEmitter'
import { PlayerName, type UsePlayerArg, type UsePlayerExpose } from '@/logic/ThePlayer/useThePlayer'
import { useTheLoop } from '@/logic/ThePlayer/useTheLoop'

// Utlis
import { getNextItem, getPreviousItem } from '@/utils/playerUtils'
import { createCustomError, type CustomError, type CustomErrorData } from '@/models/customError'
import { logError } from '@/utils/errorUtils'

export const usePinedPlayer = ({
  showNextItem,
  setNextItem,
  getItemDuration,
}: UsePlayerArg) => {

  const thePlayerStore = useThePlayerStore()
  const playerOptsStore = usePlayerOptionsStore()
  const theLoopStore = useTheLoopStore()

  const isFetchItemRandomly = computed(() => playerOptsStore.isFetchItemRandomly.value)

  const isActivePlayer = computed<boolean>(
    () => thePlayerStore.playerName.value === PlayerName.pined,
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
  } = usePinedPlayerStore()

  // #region Methods
  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    const customError = createCustomError(error, {
      ...errorData,
      file: 'players/usePinedPlayer.ts',
    })
    logError(customError)

    return customError
  }

  function activatePlayerFeatures (): void {
    // Player's components/feature enabled/disabled
    thePlayerStore.theLoopEnabled.value = true
    thePlayerStore.itemsInfoEnabled.value = true
    thePlayerStore.pauseEnabled.value = true

    // Loop's components/feature enabled/disabled
    theLoopStore.showRemainingTime.value = true
  }

  function addEventsListeners (): void {
    removeEventsListeners()
    emitter.on(ON_ITEM_UNPINED, onUnpined)
    emitter.on(ON_THE_PLAYER_STOP, removeEventsListeners)
  }

  function removeEventsListeners (): void {
    emitter.off(ON_ITEM_UNPINED, onUnpined)
    emitter.off(ON_THE_PLAYER_STOP, removeEventsListeners)
  }

  function initPlayerStates (): void {
    thePlayerStore.itemsCount.value = items.value.length
    thePlayerStore.itemIndex.value = itemIndex.value
  }

  async function showItem (itemToShow: Item, itemIndexToShow: number): Promise<void> {
    setNextItem(itemToShow)
    await showNextItem()

    item.value = itemToShow
    itemIndex.value = itemIndexToShow

    thePlayerStore.item.value = item.value
    thePlayerStore.itemIndex.value = itemIndex.value

    theLoopStore.value.value = 0
    theLoopStore.maxValue.value = getItemDuration() || playerOptsStore.interval.value * 1000
    theLoopStore.indeterminate.value = false
  }

  async function onLoopEnd (): Promise<void> {
    theLoopStore.indeterminate.value = true

    if (!nextItem.value) {
      return await next()
    }

    await showItem(nextItem.value, nextItemIndex.value)

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
    addEventsListeners()
    reset()

    theLoopStore.indeterminate.value = true
    isStopped.value = false

    itemIndex.value = -1

    initPlayerStates()

    if (!items.value.length) {
      throw onError('Pined items are empty.')
    }

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
    const { itm, index } = getNextItem({ items, itemIndex, isFetchItemRandomly })
    nextItem.value = itm
    nextItemIndex.value = index

    if (!nextItem.value) {
      isStopped.value = true
      throw onError('No next item found.')
    }

    await theLoop.stopLooping()
    await onLoopEnd()
  }

  async function previous (): Promise<void> {
    const { itm, index } = getPreviousItem({ items, itemIndex })
    nextItem.value = itm
    nextItemIndex.value = index

    if (!nextItem.value) {
      isStopped.value = true
      throw onError('No previous item found.')
    }

    await theLoop.stopLooping()
    await onLoopEnd()
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
    isOnHold.value = false
    activatePlayerFeatures()
    initPlayerStates()

    if (item.value) {
      await showItem(item.value, itemIndex.value)
    }
  }

  function reset (): void {
    activatePlayerFeatures()
  }

  function onUnpined (): void {
    // TODO: if no more items in the list, stop playing.

    if (isActivePlayer.value) {
      thePlayerStore.itemsCount.value = items.value.length
      thePlayerStore.itemIndex.value = itemIndex.value

      next()
    }
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
