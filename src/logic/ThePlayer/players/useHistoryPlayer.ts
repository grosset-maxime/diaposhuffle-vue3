// Types
import type { Item } from '@/models/item'
import type { CustomError, CustomErrorData } from '@/models/error'
import { PlayerName, type UsePlayerArg, type UsePlayerExpose } from '@/logic/ThePlayer/useThePlayer'

// Vendors Libs
import { computed } from 'vue'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { useHistoryPlayerStore } from '@/stores/ThePlayer/players/historyPlayerStore'
import { getNextItem, getPreviousItem } from '@/utils/playerUtils'
import { useErrorStore } from '@/stores/errorStore'

export const useHistoryPlayer = ({
  showNextItem,
  setNextItem,
}: UsePlayerArg) => {
  const thePlayerStore = useThePlayerStore()
  const errorStore = useErrorStore()

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

    onDeleteItem: onDeleteItemStore,
  } = useHistoryPlayerStore()

  // #region Methods
  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    return errorStore.add(error, {
      ...errorData,
      file: 'useHistoryPlayer.ts',
      actionName: 'PLAYER_A_FETCH_PREV',
    })
  }

  function activatePlayerFeatures (): void {
    // Player's components/feature enabled/disabled
    thePlayerStore.itemsInfoEnabled.value = true
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
  }

  async function onEnd (): Promise<void> {
    if (!nextItem.value) {
      return await next()
    }

    await showItem(nextItem.value, nextItemIndex.value)

    nextItem.value = undefined
    nextItemIndex.value = -1
  }
  // #endregion Methods

  // #region Exposed Actions
  async function start (): Promise<void> {
    reset()
    isStopped.value = false

    itemIndex.value = 0
    initPlayerStates()

    if (!items.value.length) {
      throw onError('History items are empty.')
    }

    await previous()
  }

  function stop (): void {
    isStopped.value = true
  }

  function pause (): void {}

  function resume (): void {}

  async function next (): Promise<void> {
    const { itm, index } = getNextItem({ items, itemIndex })
    nextItem.value = itm
    nextItemIndex.value = index

    if (!nextItem.value) {
      isStopped.value = true
      throw onError('No next item found.')
    }

    await onEnd()
  }

  async function previous (): Promise<void> {
    const { itm, index } = getPreviousItem({ items, itemIndex })
    nextItem.value = itm
    nextItemIndex.value = index

    if (!nextItem.value) {
      isStopped.value = true
      throw onError('No previous item found.')
    }

    await onEnd()
  }

  function canNext (): boolean { return true }
  function canPrevious (): boolean { return true }

  function canPause (): boolean { return false }
  function canResume (): boolean { return false }

  function setOnHold (): void {
    isOnHold.value = true
  }

  async function leaveOnHoldAndResume (): Promise<void> {
    isOnHold.value = false
    activatePlayerFeatures()
    initPlayerStates()

    itemIndex.value = items.value.length - 1
    thePlayerStore.itemIndex.value = itemIndex.value
  }

  function reset (): void {
    activatePlayerFeatures()
  }

  function onDeleteItem (itm: Item): void {
    onDeleteItemStore(itm)

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
    onDeleteItem,
  }

  return player
}
