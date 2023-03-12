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
  const showTheHelp = ref(false);

  // Getters
  const getShowMenu = () => states.value.showMenu;
  const getRailMenu = () => states.value.railMenu;
  const getLastVisitedRoute = () => states.value.lastVisitedRoute;
  const getTheme = () => states.value.theme;

  // Mutations
  const setShowMenu = (val: boolean) => (states.value.showMenu = val);
  const setRailMenu = (val: boolean) => (states.value.railMenu = val);
  const setLastVisitedRoute = (val: string) => (states.value.lastVisitedRoute = val);

  return {
    // States
    showTheHelp,

    // Getters
    getShowMenu,
    getRailMenu,
    getLastVisitedRoute,
    getTheme,

    // Mutations
    setShowMenu,
    setRailMenu,
    setLastVisitedRoute,
  };
});
