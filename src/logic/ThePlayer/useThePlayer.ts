// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { ref, computed, watch, type ComputedRef } from 'vue'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptions'

// Players
import { useFSPlayer } from '@/logic/ThePlayer/players/useFSPlayer'
import { useDBPlayer } from '@/logic/ThePlayer/players/useDBPlayer'
import { usePinedPlayer } from '@/logic/ThePlayer/players/usePinedPlayer'
import { useHistoryPlayer } from '@/logic/ThePlayer/players/useHistoryPlayer'

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
  isOnHold: ComputedRef<boolean>

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

  setOnHold: () => void
  leaveOnHoldAndResume: () => void
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
    playerName,
    resetPlayerFeatures,
  } = useThePlayerStore()

  const sourceOptsStore = useSourceOptionsStore()
  const thePlayerStore = useThePlayerStore()

  const canSwitchPlayer = ref<boolean>(false)

  function guessPlayerName (): PlayerName {
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

  playerName.value = guessPlayerName()
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

  watch(player, (activePlayer, previousPlayer) => {
    if (!canSwitchPlayer.value) { return }

    previousPlayer.setOnHold()

    resetPlayerFeatures()

    if (activePlayer.isOnHold.value) {
      activePlayer.leaveOnHoldAndResume()
    } else {
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
    thePlayerStore.reset()
  }

  const switchToHistoryPlayer = (): void => {
    if (!canSwitchPlayer.value
      || playerName.value === PlayerName.history
    ) { return }

    previousPlayerName.value = playerName.value || guessPlayerName()
    playerName.value = PlayerName.history
  }

  const switchBackToPreviousPlayer = (): void => {
    if (!canSwitchPlayer.value
      || previousPlayerName.value === playerName.value
    ) { return }

    const activePlayerName = playerName.value
    playerName.value = previousPlayerName.value
    previousPlayerName.value = activePlayerName || guessPlayerName()
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
    switchToHistoryPlayer,
    switchBackToPreviousPlayer,
    onDeleteItem,
  }
}
