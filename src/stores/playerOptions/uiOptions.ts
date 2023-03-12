// import { ref } from 'vue';
import { createGlobalState, useStorage } from '@vueuse/core';

interface states {
  showPath: boolean;
  pinPath: boolean;

  showTags: boolean;
  pinTags: boolean;

  showHistory: boolean;
  pinHistory: boolean;

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

    showHistory: true,
    pinHistory: true,

    showPined: true,
    pinPined: true,

    showListIndex: true,
    pinListIndex: true,

    showLoop: true,
    pinLoop: true,
  };

  // State
  const states = useStorage('ds3-playerOpts-uiOpts', defaultStates, localStorage, {
    mergeDefaults: true,
  });

  // Getters
  const isShowPath = () => states.value.showPath;
  const isPinPath = () => states.value.pinPath;
  const isShowTags = () => states.value.showTags;
  const isPinTags = () => states.value.pinTags;
  const isShowHistory = () => states.value.showHistory;
  const isPinHistory = () => states.value.pinHistory;
  const isShowPined = () => states.value.showPined;
  const isPinPined = () => states.value.pinPined;
  const isShowListIndex = () => states.value.showListIndex;
  const isPinListIndex = () => states.value.pinListIndex;
  const isShowLoop = () => states.value.showLoop;
  const isPinLoop = () => states.value.pinLoop;

  // Mutations
  const setShowPath = (val: boolean) => (states.value.showPath = val);
  const setPinPath = (val: boolean) => (states.value.pinPath = val);
  const setShowTags = (val: boolean) => (states.value.showTags = val);
  const setPinTags = (val: boolean) => (states.value.pinTags = val);
  const setShowHistory = (val: boolean) => (states.value.showHistory = val);
  const setPinHistory = (val: boolean) => (states.value.pinHistory = val);
  const setShowPined = (val: boolean) => (states.value.showPined = val);
  const setPinPined = (val: boolean) => (states.value.pinPined = val);
  const setShowListIndex = (val: boolean) => (states.value.showListIndex = val);
  const setPinListIndex = (val: boolean) => (states.value.pinListIndex = val);
  const setShowLoop = (val: boolean) => (states.value.showLoop = val);
  const setPinLoop = (val: boolean) => (states.value.pinLoop = val);
  const toggleShowAll = (val: boolean) => {
    setShowPath(val);
    setShowTags(val);
    setShowHistory(val);
    setShowPined(val);
    setShowListIndex(val);
    setShowLoop(val);
  };
  const togglePinAll = (val: boolean) => {
    setPinPath(val);
    setPinTags(val);
    setPinHistory(val);
    setPinPined(val);
    setPinListIndex(val);
    setPinLoop(val);
  };

  return {
    // Getters
    isShowPath,
    isPinPath,
    isShowTags,
    isPinTags,
    isShowHistory,
    isPinHistory,
    isShowPined,
    isPinPined,
    isShowListIndex,
    isPinListIndex,
    isShowLoop,
    isPinLoop,

    // Mutations
    setShowPath,
    setPinPath,
    setShowTags,
    setPinTags,
    setShowHistory,
    setPinHistory,
    setShowPined,
    setPinPined,
    setShowListIndex,
    setPinListIndex,
    setShowLoop,
    setPinLoop,
    toggleShowAll,
    togglePinAll,
  };
});
