// Types
import type { Item } from '@/models/item'
import type { UsePlayerArg, UsePlayerExpose } from '@/logic/ThePlayer/thePlayer'

// Vendors Libs
import { computed, ref } from 'vue'

import { buildError } from '@/api/api'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { useTheHistoryStore } from '@/stores/ThePlayer/TheHistoryStore'

export const useHistoryPlayer = ({
  showNextItem,
  setNextItem,
}: UsePlayerArg) => {
  const theHistoryStore = useTheHistoryStore()
  const thePlayerStore = useThePlayerStore()

  const isStopped = ref(true)
  const isPaused = ref(false)

  const items = ref<Array<Item>>([])
  const item = ref<Item | undefined>()
  const itemIndex = ref<number>(NaN)

  const nextItem = ref<Item | undefined>()
  const nextItemIndex = ref<number>(NaN)

  // State
  const errors = ref<Array<{ [key: string]: unknown }>>([])

  // #region Methods
  function addError ({ actionName, error }: { actionName: string; error: unknown }): void {
    errors.value.push({
      [ actionName ]: error,
    })
    console.error(actionName, error)
  }

  const onError = (e: unknown) => {
    const error = buildError(e)
    addError({
      actionName: 'PLAYER_A_FETCH_PREV',
      error,
    })
    return error
  }

  function getNextItem (): { itm: Item, index: number } {
    let index: number = itemIndex.value + 1

    if (index >= items.value.length) { // TODO: do it if canLoop.
      index = 0
    }

    const itm = items.value[ index ]

    if (!itm) { throw new Error('No next item found.') }

    return { itm, index }
  }

  function getPreviousItem (): { itm: Item, index: number } {
    let index: number = itemIndex.value - 1

    if (index < 0) { // TODO: do it if canLoop.
      index = items.value.length - 1
    }

    const itm: Item = items.value[ index ]

    if (!itm) { throw new Error('No next item found.') }

    return { itm, index }
  }

  async function onEnd (): Promise<void> {
    if (!nextItem.value) {
      const { itm, index } = getNextItem()
      nextItem.value = itm
      nextItemIndex.value = index
    }

    if (!nextItem.value) { throw new Error('No next item found.') }

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

    items.value = theHistoryStore.items.value
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
    const { itm, index } = getNextItem()
    nextItem.value = itm
    nextItemIndex.value = index

    await onEnd()
  }

  async function previous (): Promise<void> {
    const { itm, index } = getPreviousItem()
    nextItem.value = itm
    nextItemIndex.value = index

    await onEnd()
  }

  function canNext (): boolean { return true }
  function canPrevious (): boolean { return true }

  function canPause (): boolean { return false }
  function canResume (): boolean { return false }

  function reset (): void {
    isStopped.value = true
    isPaused.value = false

    items.value = []
    itemIndex.value = NaN
    item.value = undefined
    nextItem.value = undefined
    nextItemIndex.value = NaN

    // Player's components/feature enabled/disabled
    thePlayerStore.itemsInfoEnabled.value = true

    errors.value = []
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
