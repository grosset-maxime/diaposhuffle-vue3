// Types
import type { Item } from '@/models/item'
import type { CustomError, CustomErrorData } from '@/models/error'
import type { UsePlayerArg, UsePlayerExpose } from '@/logic/ThePlayer/thePlayer'

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
  const historyPlayerStore = useHistoryPlayerStore()
  const thePlayerStore = useThePlayerStore()
  const errorStore = useErrorStore()

  const {
    isStopped,
    isPaused,

    items,
    item,
    itemIndex,
    nextItem,
    nextItemIndex,

    reset: resetStore,
  } = useHistoryPlayerStore()

  // #region Methods
  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    return errorStore.add(error, {
      ...errorData,
      file: 'fsPlayer.ts',
      actionName: 'PLAYER_A_FETCH_PREV',
    })
  }

  async function onEnd (): Promise<void> {
    if (!nextItem.value) {
      return await next()
    }

    setNextItem(nextItem.value)
    await showNextItem()

    item.value = nextItem.value
    itemIndex.value = nextItemIndex.value

    thePlayerStore.item.value = item.value
    thePlayerStore.itemIndex.value = itemIndex.value

    nextItem.value = undefined
    nextItemIndex.value = -1
  }
  // #endregion Methods

  // #region Exposed Actions
  async function start (): Promise<void> {
    isStopped.value = false

    items.value = historyPlayerStore.items.value
    itemIndex.value = 0

    thePlayerStore.itemsCount.value = items.value.length
    thePlayerStore.itemIndex.value = itemIndex.value

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

  function reset (): void {
    resetStore()

    // Player's components/feature enabled/disabled
    thePlayerStore.itemsInfoEnabled.value = true
  }

  function onDeleteItem (itm: Item): void {
    const itms: Array<Item> = items.value
    let itmIndex: number = itemIndex.value
    let itemFound = false

    for (let i = itms.length - 1; i >= 0; i--) {
      if (itms[ i ].src === itm.src) {
        itemFound = true
        itms.splice(i, 1) // Remove the item from the array by its index.

        if (i <= itmIndex)
          itmIndex = itmIndex - 1
      }
    }

    if (itemFound) {
      items.value = itms.slice() // Clone the array (FASTEST).
      itemIndex.value = itmIndex

      // TODO: do it only if it is active player
      thePlayerStore.itemsCount.value = items.value.length
      thePlayerStore.itemIndex.value = itemIndex.value
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
