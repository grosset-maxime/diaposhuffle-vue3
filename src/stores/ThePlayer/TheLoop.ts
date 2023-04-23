// Types
import type { Ref, ComputedRef } from 'vue'

// Vendors Libs
import { computed, ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

export const useTheLoopStore = createGlobalState(() => {
  const isStopped = ref(true)
  const isLooping = ref(false)
  const isPaused = ref(false)

  // Loop states
  const enabled = ref(true)
  const indeterminate = ref(false)
  const value = ref(-1)
  const maxValue = ref(-1)
  const showDurationTime = ref(false)
  const showRemainingTime = ref(true)


  // #region Actions
  // #endregion Actions

  return {
    enabled,

    isStopped,
    isLooping,
    isPaused,

    value,
    maxValue,
    indeterminate,
    showDurationTime,
    showRemainingTime,
  }
})
