// Types
import type { Item } from '@/models/item'
import type { UsePlayerArg, UsePlayerExpose } from '../thePlayer'

// Vendors Libs
import { computed } from 'vue'

// Libs
import { useTheLoop } from '../theLoop'
import { getNextItem, getPreviousItem } from '@/utils/playerUtils'

// Stores
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'
import { useTheLoopStore } from '@/stores/ThePlayer/TheLoopStore'
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { useHistoryPlayerStore } from '@/stores/ThePlayer/players/historyPlayerStore'
import { useErrorStore } from '@/stores/errorStore'
import type { CustomError, CustomErrorData } from '@/models/error'
import { useDBPlayerStore } from '@/stores/ThePlayer/players/dbPlayerStore'


export const useDBPlayer = ({
  showNextItem,
  setNextItem,
  getItemDuration,
}: UsePlayerArg) => {
  const thePlayerStore = useThePlayerStore()
  const playerOptsStore = usePlayerOptionsStore()
  const theLoopStore = useTheLoopStore()
  const historyPlayerStore = useHistoryPlayerStore()
  const errorStore = useErrorStore()

  const isFetchItemRandomly = playerOptsStore.isFetchItemRandomly

  const {
    isStopped,
    isPaused,

    items,
    item,
    itemIndex,
    nextItem,
    nextItemIndex,

    fetchItems,
    reset: resetStore,
  } = useDBPlayerStore()

  // #region Methods
  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    return errorStore.add(error, {
      ...errorData,
      file: 'dbPlayer.ts',
      actionName: 'PLAYER_A_FETCH_PREV',
    })
  }

  async function onLoopEnd (): Promise<void> {
    theLoopStore.indeterminate.value = true

    if (!nextItem.value) {
      return await next()
    }

    historyPlayerStore.add(nextItem.value)

    setNextItem(nextItem.value)
    await showNextItem()

    item.value = nextItem.value
    itemIndex.value = nextItemIndex.value

    thePlayerStore.item.value = item.value
    thePlayerStore.itemIndex.value = itemIndex.value

    theLoopStore.value.value = 0
    theLoopStore.maxValue.value = getItemDuration() || playerOptsStore.interval.value * 1000
    theLoopStore.indeterminate.value = false

    nextItem.value = undefined
    nextItemIndex.value = -1

    if (!thePlayerStore.isPaused.value) {
      theLoop.startLooping()
    }
  }
  // #endregion Methods

  const theLoop = useTheLoop({ endFn: onLoopEnd })

  // #region Exposed Actions
  async function start (): Promise<void> {
    theLoopStore.indeterminate.value = true
    isStopped.value = false

    items.value = await fetchItems()
    itemIndex.value = -1

    if (!items.value.length) {
      isStopped.value = true
      throw onError('Items are empty.')
    }

    thePlayerStore.itemsCount.value = items.value.length
    thePlayerStore.itemIndex.value = itemIndex.value

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

  function reset (): void {
    resetStore()

    // Loop's components/feature enabled/disabled
    theLoopStore.enabled.value = true
    theLoopStore.showRemainingTime.value = true

    // Player's components/feature enabled/disabled
    thePlayerStore.itemsInfoEnabled.value = true
    thePlayerStore.historyEnabled.value = true
    thePlayerStore.pauseEnabled.value = true
  }

  function onDeleteItem (itm: Item): void {
    // TODO: if no more items in the list, stop playing.

    const itms: Array<Item> = items.value
    let itmIndex: number | undefined

    if (item.value?.src === itm.src) {
      itmIndex = itemIndex.value
    } else {
      for (let i = itms.length - 1; i > 0; i--) {
        if (itms[ i ].src === itm.src) {
          itmIndex = i
          break
        }
      }
    }

    if (typeof itmIndex === 'number') {
      itms.splice(itmIndex, 1) // Remove the item from the array by its index.
      items.value = itms.slice() // Clone the array (FASTEST).
      itemIndex.value = (itmIndex || 0) - 1

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
