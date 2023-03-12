import { ref } from 'vue';
import { createGlobalState } from '@vueuse/core';

export const useDiapoShuffleStore = createGlobalState(() => {
  // States
  const showThePlayer = ref(false);
  const showFolderBrowser = ref(false);
  const showTagger = ref(false);

  // Getters

  // Mutations

  return {
    // States
    showThePlayer,
    showFolderBrowser,
    showTagger,

    // Getters

    // Mutations
  };
});
