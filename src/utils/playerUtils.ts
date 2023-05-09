// Types
import type { MaybeRefOrGetter } from '@vueuse/core'
import type { Item } from '@/models/item'

import { toValue } from '@vueuse/core'
import { getRandomElementWithIndex } from './utils'
import { createError } from '@/models/error'

export const getRandomItem = (
  items: MaybeRefOrGetter<Array<Item>>,
): { itm: Item, index: number } => {
  const { el: itm, index } = getRandomElementWithIndex(toValue(items))

  if (!itm) {
    throw createError('No random item found.', {
      file: 'playerUtils.ts',
    })
  }

  return { itm, index }
}

interface GetNextItemOpts {
  items: MaybeRefOrGetter<Array<Item>>
  itemIndex: MaybeRefOrGetter<number>
  isFetchItemRandomly?: MaybeRefOrGetter<boolean>
}
export const getNextItem = (
  { items, itemIndex, isFetchItemRandomly = false }: GetNextItemOpts,
): { itm: Item, index: number } => {
  if (toValue(isFetchItemRandomly)) {
    return getRandomItem(items)
  }

  const itms: Array<Item> = toValue(items)
  let index: number = toValue(itemIndex) + 1

  if (index >= itms.length) { // TODO: do it if canLoop.
    index = 0
  }

  const itm: Item = itms[ index ]

  if (!itm) {
    throw createError('No next item found.', {
      file: 'playerUtils.ts',
    })
  }

  return { itm, index }
}

interface GetPreviousItemOpts {
  items: MaybeRefOrGetter<Array<Item>>
  itemIndex: MaybeRefOrGetter<number>
}
export const getPreviousItem = (
  { items, itemIndex }: GetPreviousItemOpts,
): { itm: Item, index: number } => {
  const itms: Array<Item> = toValue(items)
  let index: number = toValue(itemIndex) - 1

  if (index < 0) { // TODO: do it if canLoop.
    index = itms.length - 1
  }

  const itm: Item = itms[ index ]

  if (!itm) {
    throw createError('No previous item found.', {
      file: 'playerUtils.ts',
    })
  }

  return { itm, index }
}