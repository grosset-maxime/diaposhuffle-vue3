// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { ref, watch, type ComputedRef } from 'vue'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'
import { useSourceOptionsStore } from '@/stores/ThePlayerOptions/sourceOptionsStore'

// Players
import { useFSPlayer } from '@/logic/ThePlayer/players/useFSPlayer'
import { useDBPlayer } from '@/logic/ThePlayer/players/useDBPlayer'
import { usePinedPlayer } from '@/logic/ThePlayer/players/usePinedPlayer'
import { useHistoryPlayer } from '@/logic/ThePlayer/players/useHistoryPlayer'
import { createCustomError, CustomError, type CustomErrorData } from '@/models/customError'
import { logError } from '@/utils/errorUtils'

export enum PlayerName {
  fs = 'fsPlayer',
  db = 'dbPlayer',
  pined = 'pinedPlayer',
  history = 'historyPlayer'
}

export interface UsePlayerArg {
  setNextItem: (item: Item) => void
  showNextItem: (opts?: { animate?: boolean }) => void
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
}

interface UseThePlayer {
  setNextItem: (item: Item) => void
  showNextItem: (opts?: { animate?: boolean }) => void
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

  // #region use*Player
  const playerArg: UsePlayerArg = {
    setNextItem,
    showNextItem,
    getItemDuration,
  }
  const fsPlayer = useFSPlayer(playerArg)
  const dbPlayer = useDBPlayer(playerArg)
  const pinedPlayer = usePinedPlayer(playerArg)
  const historyPlayer = useHistoryPlayer(playerArg)
  // #endregion use*Player

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

  function getPlayer (playerName?: PlayerName): UsePlayerExpose {
    if (playerName === PlayerName.db) {
      return dbPlayer
    } else if (playerName === PlayerName.pined) {
      return pinedPlayer
    } else if (playerName === PlayerName.history) {
      return historyPlayer
    } else {
      return fsPlayer
    }
  }
  let player: UsePlayerExpose = getPlayer(playerName.value)

  watch (playerName, () => {
    if (!canSwitchPlayer.value) { return }

    const previousPlayer: UsePlayerExpose = player
    player = getPlayer(playerName.value)

    previousPlayer.setOnHold()

    resetPlayerFeatures()

    if (player.isOnHold.value) {
      player.leaveOnHoldAndResume()
    } else {
      start()
    }
  })

  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    const customError = createCustomError(error, {
      ...errorData,
      file: 'ThePlayer/useThePlayer.ts',
    })
    logError(customError)

    return customError
  }

  // #region Actions
  const start = async (): Promise<void> => {
    reset()

    const promise = player.start()

    isStopped.value = false

    // Allow to switch player after the first start.
    canSwitchPlayer.value = true

    return promise
  }

  const pause = (): void => {
    if (player.canPause()) {
      player.pause()
      isPaused.value = true
    }
  }

  const resume = (): void => {
    if (player.canResume()) {
      player.resume()
      isPaused.value = false
    }
  }

  const stop = (): void => {
    player.stop()
    isStopped.value = true
    canSwitchPlayer.value = false
  }

  const next = async (): Promise<void> => {
    try {
      if (canNext()) {
        await player.next()
      }
    } catch (e) {
      throw onError(e, { actionName: 'next' })
    }
  }
  const previous = async (): Promise<void> => {
    try {
      if (canPrevious()) {
        player.previous()
      }
    } catch (e) {
      throw onError(e, { actionName: 'previous' })
    }
  }

  const canNext = (): boolean => player.canNext()
  const canPrevious = (): boolean => player.canPrevious()

  const canPause = (): boolean => player.canPause()
  const canResume = (): boolean => player.canResume()

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
  }
}
