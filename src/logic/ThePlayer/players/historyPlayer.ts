// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { ref } from 'vue'

import { buildError } from '@/api/api'

// Stores
import type { UsePlayerArg, UsePlayerExpose } from '../thePlayer'
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
  const itemIndex = ref<number>(-1)

  const nextItem = ref<Item | undefined>()
  const nextItemIndex = ref<number>(NaN)

  // const getHistoryItemAt = (index: number) => historyItems.value[ index ]
  // const getHistoryIndex = () => historyItemIndex.value

  // const setHistoryIndex = (val: number) => (historyItemIndex.value = val)
  // const addHistoryItem = (item: Item) => historyItems.value.push(item)
  // const setHistoryItemIndex = (index: number, item: Item) => (historyItems.value[ index ] = item)
  // const deleteHistoryItem = (itemSrc: string | Item) => {
  //   const src = itemSrc instanceof ItemClass
  //     ? itemSrc.src
  //     : itemSrc
  //   historyItemIndex.value -= 1
  //   historyItems.value = historyItems.value.filter((i: Item) => i.src !== src)
  // }

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
    let index = itemIndex.value + 1

    if (index >= items.value.length) { // TODO: do it if itemsLoopFeature enabled.
      index = 0
    }

    const itm = items.value[ index ]

    if (!itm) { throw new Error('No next item found.') }

    return { itm, index }
  }

  function getPreviousItem (): { itm: Item, index: number } {
    let index = itemIndex.value - 1

    if (index < 0) { // TODO: do it if itemsLoopFeature enabled.
      index = items.value.length - 1
    }

    const itm = items.value[ index ]

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
    reset()

    isStopped.value = false

    items.value = theHistoryStore.items.value
    thePlayerStore.itemsCount.value = items.value.length

    if (!items.value.length) {
      throw onError('Pined items are empty.')
    }

    await onEnd()
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

  function canNext (): boolean {
    return itemIndex.value < (items.value.length - 1)
  }
  function canPrevious (): boolean {
    return itemIndex.value > 0
  }

  function canPause (): boolean { return false }
  function canResume (): boolean { return false }

  const reset = (): void => {
    isStopped.value = true
    isPaused.value = false

    items.value = []
    itemIndex.value = -1
    item.value = undefined
    nextItem.value = undefined
    nextItemIndex.value = -1

    thePlayerStore.reset()
    // Player's components/feature enabled/disabled
    thePlayerStore.itemsInfoEnabled.value = true

    errors.value = []
  }
  // #endregion Exposed Actions

  const player: UsePlayerExpose = {
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
  }

  return player
}
