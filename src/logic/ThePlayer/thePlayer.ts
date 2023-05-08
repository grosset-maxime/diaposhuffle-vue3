// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { ref, computed, watch, type ComputedRef } from 'vue'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptions'

// Players
import { useFSPlayer } from '@/logic/ThePlayer/players/fsPlayer'
import { useDBPlayer } from '@/logic/ThePlayer/players/dbPlayer'
import { usePinedPlayer } from '@/logic/ThePlayer/players/pinedPlayer'
import { useHistoryPlayer } from '@/logic/ThePlayer/players/historyPlayer'
import { useTheLoopStore } from '@/stores/ThePlayer/TheLoopStore'

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
  onDeleteItem: (itm: Item) => void
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
  const thePlayerStore = useThePlayerStore()
  const theLoopStore = useTheLoopStore()

  const canSwitchPlayer = ref<boolean>(false)

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

  watch(player, () => {
    if (!canSwitchPlayer.value) { return }

    // TODO: create a store per player to store items and states like paused etc...
    if (player.value.isStopped.value) {
      start()
    }
  })

  // #region Actions
  const start = (): void => {
    reset()

    player.value.start()
    isStopped.value = false

    // Allow to switch player after the first start.
    canSwitchPlayer.value = true
  }

  const pause = (): void => {
    if (player.value.canPause()) {
      player.value.pause()
      isPaused.value = true
    }
  }

  const resume = (): void => {
    if (player.value.canResume()) {
      player.value.resume()
      isPaused.value = false
    }
  }

  const stop = (): void => {
    player.value.stop()
    isStopped.value = true
    canSwitchPlayer.value = false
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

  const reset = (): void => {
    theLoopStore.reset()
    thePlayerStore.reset()
    player.value.reset()
  }

  const toggleHistoryPlayer = (): void => {
    if (!canSwitchPlayer.value) { return }

    if (canPause()) {
      player.value.pause()
    } else {
      player.value.stop()
    }

    if (playerName.value === PlayerName.history) {
      playerName.value = previousPlayerName.value
      previousPlayerName.value = PlayerName.history
    } else {
      previousPlayerName.value = playerName.value
      playerName.value = PlayerName.history
    }
  }

  const onDeleteItem = (itm: Item): void => player.value.onDeleteItem(itm)
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
    toggleHistoryPlayer,
    onDeleteItem,
  }
}
