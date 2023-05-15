import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

export const useDiapoShuffleStore = createGlobalState(() => {
  // States
  const showThePlayer = ref(false)
  const showTheFolderBrowser = ref(false)
  const showTheTagger = ref(false)

  // Getters

  // Mutations

  return {
    // States
    showThePlayer,
    showTheFolderBrowser,
    showTheTagger,

    // Getters

    // Mutations
  }
})
