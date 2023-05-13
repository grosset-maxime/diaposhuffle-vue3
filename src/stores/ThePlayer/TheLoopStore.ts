// Vendors Libs
import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

export const useTheLoopStore = createGlobalState(() => {
  const indeterminate = ref(false)
  const value = ref(NaN)
  const maxValue = ref(NaN)
  const showDurationTime = ref(false)
  const showRemainingTime = ref(false)

  function reset (): void {
    indeterminate.value = false
    value.value = NaN
    maxValue.value = NaN
    showDurationTime.value = false
    showRemainingTime.value = false
  }

  return {
    value,
    maxValue,
    indeterminate,
    showDurationTime,
    showRemainingTime,

    reset,
  }
})
