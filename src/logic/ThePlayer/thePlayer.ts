// Types
import type { ComputedRef } from 'vue'
import type { Item } from '@/models/item'

// Vendors Libs
import { ref, computed } from 'vue'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptions'

// Players
import { useFSPlayer } from '@/logic/ThePlayer/players/fsPlayer'
import { useDBPlayer } from '@/logic/ThePlayer/players/dbPlayer'
import { usePinedPlayer } from '@/logic/ThePlayer/players/pinedPlayer'

export enum PlayerName {
  fs = 'fsPlayer',
  db = 'dbPlayer',
  pined = 'pinedPlayer',
  history = 'historyPlayer'
}

export interface UsePlayerArg {
  setNextItem: (item: Item) => void
  showNextItem: () => void
  getItemDuration: () => number
  playItem?: () => void
  pauseItem?: () => void
}

export interface UsePlayerExpose {
  isStopped: ComputedRef<boolean>
  isPaused: ComputedRef<boolean>

  items?: Array<Item>
  item: ComputedRef<Item | undefined>
  itemIndex?: ComputedRef<number>

  start: () => Promise<void>
  stop: () => void
  pause: () => void
  resume: () => void
  next: () => Promise<void>
  previous: () => Promise<void>
  canNext: () => boolean
  canPrevious: () => boolean
  reset: () => void

  addItem?: (item: Item) => void
  removeItem?: (index: number) => void
}

interface UseThePlayer {
  setNextItem: (item: Item) => void
  showNextItem: () => void
  getItemDuration: () => number
  playItem: () => void
  pauseItem: () => void
}

export const useThePlayer = ({
  setNextItem,
  showNextItem,
  getItemDuration,
}: UseThePlayer) => {

  const {
    isPaused,
    isStopped,
  } = useThePlayerStore()

  const sourceOptsStore = useSourceOptionsStore()

  function getPlayerName (): PlayerName {
    let playerName: PlayerName

    if (sourceOptsStore.isFromPined.value) {
      playerName = PlayerName.pined
    } else if (sourceOptsStore.tags.value.size
      || sourceOptsStore.fileTypes.value.length
    ) {
      playerName = PlayerName.db
    } else {
      playerName = PlayerName.fs
    }

    return playerName
  }

  const playerName = ref<PlayerName>(getPlayerName())
  const previousPlayerName = ref<PlayerName>(playerName.value)

  const player = computed<UsePlayerExpose>(() => {
    const playerArg: UsePlayerArg = {
      setNextItem,
      showNextItem,
      getItemDuration,
    }

    if (playerName.value === PlayerName.db) {
      return useDBPlayer(playerArg)
    } else if (playerName.value === PlayerName.pined) {
      return usePinedPlayer(playerArg)
    } else if (playerName.value === PlayerName.history) {
      // TODO
      return useFSPlayer(playerArg)
    } else {
      return useFSPlayer(playerArg)
    }
  })

  // #region Actions
  const start = () => {
    player.value.start()

    isStopped.value = false
  }

  const pause = () => {
    player.value.pause()

    isPaused.value = true
  }

  const resume = () => {
    player.value.resume()

    isPaused.value = false
  }

  const stop = () => {
    player.value.stop()

    isStopped.value = true
  }

  const next = async () => player.value.next()

  const previous = async () => player.value.previous()

  const reset = () => {
    player.value.reset()
  }
  // #endregion Actions

  return {
    playerName,
    player,

    start,
    stop,
    pause,
    resume,
    next,
    previous,
    reset,
  }
}
