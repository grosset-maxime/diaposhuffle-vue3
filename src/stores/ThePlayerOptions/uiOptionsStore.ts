import { computed } from 'vue'
import { createGlobalState, useStorage } from '@vueuse/core'

interface states {
  showPath: boolean;
  pinPath: boolean;

  showTags: boolean;
  pinTags: boolean;

  showPined: boolean;
  pinPined: boolean;

  showListIndex: boolean;
  pinListIndex: boolean;

  showLoop: boolean;
  pinLoop: boolean;
}

export const useUIOptionsStore = createGlobalState(() => {
  const defaultStates: states = {
    showPath: true,
    pinPath: true,

    showTags: true,
    pinTags: true,

    showPined: true,
    pinPined: true,

    showListIndex: true,
    pinListIndex: false,

    showLoop: true,
    pinLoop: false,
  }

  // States
  const states = useStorage('ds3-playerOpts-uiOpts', defaultStates, localStorage, {
    mergeDefaults: true,
  })

  //#region Computeds
  const showPath = computed({
    get: () => states.value.showPath,
    set: (val) => (states.value.showPath = val),
  })
  const pinPath = computed({
    get: () => states.value.pinPath,
    set: (val) => (states.value.pinPath = val),
  })
  const showTags = computed({
    get: () => states.value.showTags,
    set: (val) => (states.value.showTags = val),
  })
  const pinTags = computed({
    get: () => states.value.pinTags,
    set: (val) => (states.value.pinTags = val),
  })
  const showPined = computed({
    get: () => states.value.showPined,
    set: (val) => (states.value.showPined = val),
  })
  const pinPined = computed({
    get: () => states.value.pinPined,
    set: (val) => (states.value.pinPined = val),
  })
  const showListIndex = computed({
    get: () => states.value.showListIndex,
    set: (val) => (states.value.showListIndex = val),
  })
  const pinListIndex = computed({
    get: () => states.value.pinListIndex,
    set: (val) => (states.value.pinListIndex = val),
  })
  const showLoop = computed({
    get: () => states.value.showLoop,
    set: (val) => (states.value.showLoop = val),
  })
  const pinLoop = computed({
    get: () => states.value.pinLoop,
    set: (val) => (states.value.pinLoop = val),
  })
  //#endregion Computeds

  //#region Mutations
  const toggleShowAll = (val: boolean) => {
    showPath.value = val
    showTags.value = val
    showPined.value = val
    showListIndex.value = val
    showLoop.value = val
  }
  const togglePinAll = (val: boolean) => {
    pinPath.value = val
    pinTags.value = val
    pinPined.value = val
    pinListIndex.value = val
    pinLoop.value = val
  }
  //#endregion Mutations

  return {
    // Writable Computeds
    showPath,
    pinPath,
    showTags,
    pinTags,
    showPined,
    pinPined,
    showListIndex,
    pinListIndex,
    showLoop,
    pinLoop,

    // Mutations
    toggleShowAll,
    togglePinAll,
  }
})
