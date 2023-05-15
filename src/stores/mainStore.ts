import { Theme } from '../interfaces/theme'

import { computed, ref } from 'vue'
import { createGlobalState, eagerComputed, useStorage } from '@vueuse/core'

interface states {
  showMenu: boolean;
  railMenu: boolean;
  lastVisitedRoute: string;
  theme: Theme;
}

export const useMainStore = createGlobalState(() => {
  const defaultStates: states = {
    showMenu: true,
    railMenu: false,
    lastVisitedRoute: '',
    theme: Theme.dark,
  }

  // State
  const states = useStorage('ds3-index', defaultStates, localStorage, { mergeDefaults: true })
  const showTheHelp = ref(false)

  const showMenu = computed({
    get: () => states.value.showMenu,
    set: (v) => states.value.showMenu = !!v,
  })

  const railMenu = computed({
    get: () => states.value.railMenu,
    set: (v) => states.value.railMenu = !!v,
  })

  const lastVisitedRoute = computed({
    get: () => states.value.lastVisitedRoute,
    set: (v) => states.value.lastVisitedRoute = v,
  })

  const theme = eagerComputed(() => states.value.theme)

  return {
    showTheHelp,
    showMenu,
    railMenu,
    lastVisitedRoute,
    theme,
  }
})
