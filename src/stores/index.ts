import { Theme } from '../interfaces/theme';

import { ref } from 'vue';
import { createGlobalState, useStorage } from '@vueuse/core';

interface states {
  showMenu: boolean;
  railMenu: boolean;
  lastVisitedRoute: string;
  theme: Theme;
}

export const useGlobalState = createGlobalState(() => {
  const defaultStates: states = {
    showMenu: true,
    railMenu: false,
    lastVisitedRoute: '',
    theme: Theme.dark,
  };

  // State
  const states = useStorage('ds3-index', defaultStates, localStorage, { mergeDefaults: true });
  const theHelpShown = ref(false);
  const thePlayerShown = ref(false);

  // Getters
  const getShowMenu = () => states.value.showMenu;
  const getRailMenu = () => states.value.railMenu;
  const getLastVisitedRoute = () => states.value.lastVisitedRoute;
  const getTheme = () => states.value.theme;

  const isTheHelpShown = () => theHelpShown.value;
  const isThePlayerShown = () => thePlayerShown.value;

  // Mutations
  const setShowMenu = (val: boolean) => (states.value.showMenu = val);
  const setRailMenu = (val: boolean) => (states.value.railMenu = val);
  const setLastVisitedRoute = (val: string) => (states.value.lastVisitedRoute = val);
  const toggleTheHelp = (show?: boolean) => {
    theHelpShown.value = typeof show === 'boolean' ? show : !theHelpShown.value;
  };
  const setShowTheHelp = (show: boolean) => toggleTheHelp(show);
  const setShowThePlayer = (show: boolean) => (thePlayerShown.value = show);

  return {
    // Getters
    getShowMenu,
    getRailMenu,
    getLastVisitedRoute,
    getTheme,
    isTheHelpShown,
    isThePlayerShown,

    // Mutations
    setShowMenu,
    setRailMenu,
    setLastVisitedRoute,
    toggleTheHelp,
    setShowTheHelp,
    setShowThePlayer,
  };
});
