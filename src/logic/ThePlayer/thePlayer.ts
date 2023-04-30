// Types
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
import { useHistoryPlayer } from '@/logic/ThePlayer/players/historyPlayer'

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
  start: () => Promise<void>
  stop: () => void
  pause: () => void
  resume: () => void
  next: () => Promise<void>
  previous: () => Promise<void>
  canNext: () => boolean
  canPrevious: () => boolean
  canPause: () => boolean
  canResume: () => boolean
  reset: () => void
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
      return useHistoryPlayer(playerArg)
    } else {
      return useFSPlayer(playerArg)
    }
  })

  // #region Actions
  const start = (): void => {
    player.value.start()
    isStopped.value = false
  }

  const pause = (): void => {
    player.value.pause()
    isPaused.value = true
  }

  const resume = (): void => {
    player.value.resume()
    isPaused.value = false
  }

  const stop = (): void => {
    player.value.stop()
    isStopped.value = true
  }

  const next = async (): Promise<void> => {
    if (canNext()) {
      player.value.next()
    }
  }
  const previous = async (): Promise<void> => {
    if (canPrevious()) {
      player.value.previous()
    }
  }

  const canNext = (): boolean => player.value.canNext()
  const canPrevious = (): boolean => player.value.canPrevious()

  const canPause = (): boolean => player.value.canPause()
  const canResume = (): boolean => player.value.canResume()

  const reset = (): void => player.value.reset()
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
    canNext,
    canPrevious,
    canPause,
    canResume,
    reset,
  }
}
