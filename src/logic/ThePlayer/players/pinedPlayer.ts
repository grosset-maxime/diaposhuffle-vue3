// TODO: Bug: Manage unpin on playing pined items.

// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { computed } from 'vue'

// Stores
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'
import type { UsePlayerArg, UsePlayerExpose } from '../thePlayer'
import { useTheLoop } from '../theLoop'
import { useTheLoopStore } from '@/stores/ThePlayer/TheLoopStore'
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { usePinedPlayerStore } from '@/stores/ThePlayer/players/pinedPlayerStore'
import { getNextItem, getPreviousItem } from '@/utils/playerUtils'
import { useErrorStore } from '@/stores/errorStore'
import type { CustomError, CustomErrorData } from '@/models/error'

export const usePinedPlayer = ({
  showNextItem,
  setNextItem,
  getItemDuration,
}: UsePlayerArg) => {
  const pinedPlayerStore = usePinedPlayerStore()
  const thePlayerStore = useThePlayerStore()
  const playerOptsStore = usePlayerOptionsStore()
  const theLoopStore = useTheLoopStore()
  const errorStore = useErrorStore()

  const isFetchItemRandomly = computed(() => playerOptsStore.isFetchItemRandomly.value)

  const {
    isStopped,
    isPaused,

    items,
    item,
    itemIndex,
    nextItem,
    nextItemIndex,

    reset: resetStore,
  } = usePinedPlayerStore()

  // #region Methods
  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    return errorStore.add(error, {
      ...errorData,
      file: 'pinedPlayer.ts',
      actionName: 'PLAYER_A_FETCH_PREV',
    })
  }

  async function onLoopEnd (): Promise<void> {
    theLoopStore.indeterminate.value = true

    if (!nextItem.value) {
      return await next()
    }

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

  const theLoop = useTheLoop({ endFn: onLoopEnd })
  // #endregion Methods

  // #region Exposed Actions
  async function start (): Promise<void> {
    reset()

    theLoopStore.indeterminate.value = true
    isStopped.value = false

    items.value = pinedPlayerStore.items.value
    itemIndex.value = -1

    thePlayerStore.itemsCount.value = items.value.length
    thePlayerStore.itemIndex.value = itemIndex.value

    if (!items.value.length) {
      throw onError('Pined items are empty.')
    }

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
    thePlayerStore.pauseEnabled.value = true
  }

  function onDeleteItem (itm: Item): void {
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
