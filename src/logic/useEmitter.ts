// Types
import type { Emitter } from 'mitt'
import type { Item } from '@/models/item'

// Vendors libs
import mitt from 'mitt'

export type MittEvents = {
  'item.deleted': Item
  'item.unpined': Item

  'thePlayer.stop': void

  'dbPlayerStore.afterDeleteItem': Item
  'fsPlayerStore.afterDeleteItem': Item
  'historyPlayerStore.afterDeleteItem': Item
}

// #region Events names
export const ON_ITEM_DELETED = 'item.deleted'
export const ON_ITEM_UNPINED = 'item.unpined'

export const ON_THE_PLAYER_STOP = 'thePlayer.stop'

export const ON_DB_PLAYER_STORE_AFTER_DELETE_ITEM = 'dbPlayerStore.afterDeleteItem'
export const ON_FS_PLAYER_STORE_AFTER_DELETE_ITEM = 'fsPlayerStore.afterDeleteItem'
export const ON_HISTORY_PLAYER_STORE_AFTER_DELETE_ITEM = 'historyPlayerStore.afterDeleteItem'
// #endregion Events names

export const emitter: Emitter<MittEvents> = mitt<MittEvents>()
