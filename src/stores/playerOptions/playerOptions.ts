import { computed } from 'vue'
import { createGlobalState, useStorage } from '@vueuse/core'

interface states {
  interval: number;
  zoom: number;
  isMuteVideo: boolean;
  isFetchItemRandomly: boolean;
}

export const usePlayerOptionsStore = createGlobalState(() => {
  const DEFAULT_INTERVAL = 3 // seconds
  const DEFAULT_ZOOM = 1
  const DEFAULT_IS_MUTE_VIDEO = false
  const DEFAULT_IS_FETCH_ITEM_RAMDOMLY = true

  const defaultStates: states = {
    interval: DEFAULT_INTERVAL,
    zoom: DEFAULT_ZOOM,
    isMuteVideo: DEFAULT_IS_MUTE_VIDEO,
    isFetchItemRandomly: DEFAULT_IS_FETCH_ITEM_RAMDOMLY,
  }

  // State
  const states = useStorage('ds3-playerOpts-playerOpts', defaultStates, localStorage, {
    mergeDefaults: true,
  })

  //#region Computeds
  const interval = computed({
    get: () => states.value.interval,
    set: (v) => (
      states.value.interval = typeof v === 'number'
        ? v
        : parseInt(v || `${DEFAULT_INTERVAL}`, 10) || DEFAULT_INTERVAL
    ),
  })
  const zoom = computed({
    get: () => states.value.zoom,
    set: (v) => (
      states.value.zoom = typeof v === 'number'
        ? v
        : parseInt(v || `${DEFAULT_ZOOM}`, 10) || DEFAULT_ZOOM
    ),
  })
  const isMuteVideo = computed({
    get: () => states.value.isMuteVideo,
    set: (v) => states.value.isMuteVideo = !!v,
  })
  const isFetchItemRandomly = computed({
    get: () => states.value.isFetchItemRandomly,
    set: (v) => states.value.isFetchItemRandomly = !!v,
  })
  //#endregion

  //#region Mutations
  const resetInterval = () => interval.value = DEFAULT_INTERVAL
  //#endregion

  return {
    // Writable computeds
    interval,
    zoom,
    isMuteVideo,
    isFetchItemRandomly,

    // Mutations
    resetInterval,
  }
})
