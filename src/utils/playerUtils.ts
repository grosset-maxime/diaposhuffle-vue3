// Types
import type { MaybeRefOrGetter } from '@vueuse/core'
import type { Item } from '@/models/item'

import { toValue } from '@vueuse/core'
import { getRandomElementWithIndex } from './utils'
import { createCustomError, type CustomError, type CustomErrorData } from '@/models/customError'
import { logError } from './errorUtils'

function onError (error: any, errorData: CustomErrorData): CustomError {
  return logError(
    createCustomError(error, {
      file: 'utils/playerUtils.ts',
      ...errorData,
    }),
  )
}

export const getRandomItem = (
  items: MaybeRefOrGetter<Array<Item>>,
): { itm: Item, index: number } => {
  const { el: itm, index } = getRandomElementWithIndex(toValue(items))

  if (!itm) {
    throw onError('No random item found.', {
      actionName: 'getRandomItem',
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
    throw onError('No next item found.', {
      actionName: 'getNextItem',
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
    throw onError('No previous item found.', {
      actionName: 'getPreviousItem',
    })
  }

  return { itm, index }
}