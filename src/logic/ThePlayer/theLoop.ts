// Types
import type { Ref } from 'vue'

// Vendors Libs
import { ref, computed } from 'vue'

import { wait } from '@/utils/utils'

import { useTheLoopStore } from '@/stores/ThePlayer/TheLoop'

const LOOP_STEP = 100 // In ms.
const LOOP_ANIMATION_WAIT = 200 // In ms.

interface UseTheLoop {
  endFn: () => Promise<void>
  step?: Ref<number>
}
export const useTheLoop = ({ endFn, step = ref(LOOP_STEP) }: UseTheLoop) => {

  const {
    value,
    maxValue,
  } = useTheLoopStore()

  const getTimeText = (ms: number, { noMs = false } = {}) => {
    const date = new Date(2020, 0, 0)

    date.setMilliseconds(Math.abs(ms))
    const hours = date.getHours()
    const mins = date.getMinutes()
    const seconds = date.getSeconds()
    const dms = date.getMilliseconds()

    let text = ''

    if (hours) {
      text += `${hours}h `
    }
    if (mins) {
      text += `${mins}m `
    }
    text += `${seconds}s `
    if (!noMs && !hours && !mins && seconds < 10) {
      text += `${dms / 100}ms`
    }

    return text
  }

  // Refs
  const timeout = ref<number | undefined>()
  const pause = ref(false)
  const stop = ref(false)

  const isLooping = ref(false)

  const percentage = computed<number>(
    () => (value.value * 100) / maxValue.value,
  )
  const remainingTimeText = computed<string>(
    () => getTimeText(maxValue.value - value.value),
  )
  const durationTimeText = computed<string>(
    () => getTimeText(maxValue.value, { noMs: true }),
  )

  async function startLooping (): Promise<void> {
    stop.value = false
    pause.value = false

    clearTimeoutLoop()
    await goToLoopStart()
    looop()
  }

  async function stopLooping (): Promise<void> {
    clearTimeoutLoop()

    isLooping.value = false
    stop.value = true

    await goToLoopStart()
  }

  function pauseLooping (): void {
    isLooping.value = false
    pause.value = true

    clearTimeoutLoop()
  }

  function resumeLooping (): void {
    if (!pause.value) {
      return
    }

    pause.value = false
    stop.value = false

    looop()
  }

  function looop (): void {
    isLooping.value = true
    clearTimeoutLoop()

    if (stop.value || pause.value) {
      value.value -= step.value
      return
    }

    timeout.value = setTimeout(async () => {
      value.value += step.value

      // If loop has not yet reach its end, continue to loop.
      if (value.value <= maxValue.value) {
        looop()
        return
      }

      // Add timeout to have feeling that loop reach the end.
      await wait({ time: LOOP_ANIMATION_WAIT })

      onLoopEnd()
    }, step.value)
  }

  function clearTimeoutLoop (): void {
    clearTimeout(timeout.value)
    timeout.value = undefined
  }

  async function goToLoopEnd (options = {}): Promise<void> {
    const prevValue = value.value

    clearTimeoutLoop()
    value.value = maxValue.value

    if (prevValue !== maxValue.value) {
      await wait({ time: LOOP_ANIMATION_WAIT })
    }

    onLoopEnd(options)
  }

  async function goToLoopStart (): Promise<void> {
    const prevValue = value.value
    value.value = 0

    if (prevValue) {
      await wait({ time: LOOP_ANIMATION_WAIT })
    }
  }

  async function onLoopEnd ({ noEvent = false } = {}): Promise<void> {
    isLooping.value = false
    if (!noEvent) {
      await endFn()
    }
  }

  return {
    isLooping: computed<boolean>(() => isLooping.value),
    isPaused: computed<boolean>(() => pause.value),
    isStopped: computed<boolean>(() => stop.value),

    percentage,
    remainingTimeText,
    durationTimeText,

    startLooping,
    stopLooping,
    pauseLooping,
    resumeLooping,

    goToLoopStart,
    goToLoopEnd,
  }
}