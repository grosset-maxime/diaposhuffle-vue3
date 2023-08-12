// Types
import type { Emitter } from 'mitt'
import type { Item } from '@/models/item'
import type { CustomError } from '@/models/customError'

// Vendors libs
import mitt from 'mitt'

// #region Events names
export const ON_ITEM_DELETED = 'item.deleted'
export const ON_ITEM_UNPINED = 'item.unpined'

export const ON_THE_PLAYER_STOP = 'thePlayer.stop'

export const ON_DB_PLAYER_STORE_AFTER_DELETE_ITEM = 'dbPlayerStore.afterDeleteItem'
export const ON_FS_PLAYER_STORE_AFTER_DELETE_ITEM = 'fsPlayerStore.afterDeleteItem'
export const ON_HISTORY_PLAYER_STORE_AFTER_DELETE_ITEM = 'historyPlayerStore.afterDeleteItem'

export const ON_LOG_ERROR = 'error.logError'
// #endregion Events names

export type MittEvents = {
  [ON_ITEM_DELETED]: Item
  [ON_ITEM_UNPINED]: Item

  [ON_THE_PLAYER_STOP]: void

  [ON_DB_PLAYER_STORE_AFTER_DELETE_ITEM]: Item
  [ON_FS_PLAYER_STORE_AFTER_DELETE_ITEM]: Item
  [ON_HISTORY_PLAYER_STORE_AFTER_DELETE_ITEM]: Item

  [ON_LOG_ERROR]: CustomError
}

export const emitter: Emitter<MittEvents> = mitt<MittEvents>()
