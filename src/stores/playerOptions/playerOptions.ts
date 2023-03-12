// import { ref } from 'vue';
import { createGlobalState, useStorage } from '@vueuse/core';

interface states {
  interval: number;
  zoom: number;
  isMuteVideo: boolean;
  isFetchItemRandomly: boolean;
}

export const usePlayerOptionsStore = createGlobalState(() => {
  const DEFAULT_INTERVAL = 3; // seconds
  const DEFAULT_ZOOM = 1;
  const DEFAULT_IS_MUTE_VIDEO = false;
  const DEFAULT_IS_FETCH_ITEM_RAMDOMLY = true;

  const defaultStates: states = {
    interval: DEFAULT_INTERVAL,
    zoom: DEFAULT_ZOOM,
    isMuteVideo: DEFAULT_IS_MUTE_VIDEO,
    isFetchItemRandomly: DEFAULT_IS_FETCH_ITEM_RAMDOMLY,
  };

  // State
  const states = useStorage('ds3-playerOpts-playerOpts', defaultStates, localStorage, {
    mergeDefaults: true,
  });

  // Getters
  const getInterval = () => states.value.interval;
  const getZoom = () => states.value.zoom;
  const isMuteVideo = () => states.value.isMuteVideo;
  const isFetchItemRandomly = () => states.value.isFetchItemRandomly;

  // Mutations
  const setInterval = (val: number) => (states.value.interval = val);
  const resetInterval = () => setInterval(DEFAULT_INTERVAL);
  const setZoom = (val: number) => (states.value.zoom = val);
  const setIsMuteVideo = (val: boolean) => (states.value.isMuteVideo = val);
  const setIsFetchItemRandomly = (val: boolean) => (states.value.isFetchItemRandomly = val);

  return {
    // Getters
    getInterval,
    getZoom,
    isMuteVideo,
    isFetchItemRandomly,

    // Mutations
    setInterval,
    resetInterval,
    setZoom,
    setIsMuteVideo,
    setIsFetchItemRandomly,
  };
});
