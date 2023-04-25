// Vendors Libs
import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

export const useTheLoopStore = createGlobalState(() => {
  // Loop states
  const enabled = ref(true)
  const indeterminate = ref(false)
  const value = ref(-1)
  const maxValue = ref(-1)
  const showDurationTime = ref(false)
  const showRemainingTime = ref(true)

  return {
    enabled,
    value,
    maxValue,
    indeterminate,
    showDurationTime,
    showRemainingTime,
  }
})
