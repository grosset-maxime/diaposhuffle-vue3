<script setup lang="ts">
// Vendors Libs
import { ref, computed } from 'vue'

import { useTheLoopStore } from '@/stores/ThePlayer/TheLoop'
import { watch } from 'vue'

const LOOP_DETERMINATE_COLOR = '#E87B00CC' // $orange-1 + light opacity.
const LOOP_INDETERMINATE_COLOR = '#2196f3BB' // primary color + ligth opacity.
const LOOP_DETERMINATE_HEIGHT = 20
const LOOP_INDETERMINATE_HEIGHT = 4

// Props
interface Props {
  up?: boolean;
}
withDefaults(defineProps<Props>(), {
  up: false,
})

function getTimeText (ms: number, { noMs = false } = {}) {
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

const {
  indeterminate,
  value: loopVal,
  maxValue,
  showDurationTime,
  showRemainingTime,
} = useTheLoopStore()

// Refs
const color = ref(LOOP_INDETERMINATE_COLOR)
const striped = ref(false)
const height = ref(LOOP_INDETERMINATE_HEIGHT)

// #region Computeds
// const percentage = computed(() => (value.value * 100) / valueMax.value)

const text = computed<string>(() => {
  let val = ''

  if (showRemainingTime.value) {
    val = remainingTimeText.value
  }

  if (showDurationTime.value) {
    if (val) {
      val = `${val} / `
    }
    val = `${val}${durationTimeText.value}`
  }

  return val
})

const remainingTimeText = computed<string>(
  () => getTimeText(maxValue.value - loopVal.value),
)
const durationTimeText = computed<string>(
  () => getTimeText(maxValue.value, { noMs: true }),
)

const showText = computed<boolean>(
  () => !!(!indeterminate.value
  && (showRemainingTime.value || showDurationTime.value)
  && text),
)
// #endregion Computeds

function goToLoopStart (): void {
  loopVal.value = 0
}

watch(indeterminate, (isIndeterminate) => {
  if (isIndeterminate) {
    color.value = LOOP_INDETERMINATE_COLOR
    height.value = LOOP_INDETERMINATE_HEIGHT
    striped.value = true
  } else {
    color.value = LOOP_DETERMINATE_COLOR
    height.value = LOOP_DETERMINATE_HEIGHT
    striped.value = false
  }
})
</script>

<template>
  <div
    class="the-loop"
    :style="{
      transform: up ? 'translateY(0)' : `translateY(${height - 2}px)`,
    }"
  >
    <v-progress-linear
      absolute
      location="bottom"
      bg-opacity="0.3"
      :max="maxValue"
      :model-value="loopVal"
      :color="color"
      :indeterminate="indeterminate"
      :striped="striped"
      :height="height"
      @click="goToLoopStart"
    >
      <span v-if="showText" :class="['text', { up }]">
        {{ text }}
      </span>
    </v-progress-linear>
  </div>
</template>

<style lang="scss" scoped>
.the-loop {
  z-index: 1000;
  transition: transform .3s ease;

  .text {
    font-size: 0.9em;
    font-weight: bold;
    text-shadow: 0 0 2px black;
    transition: opacity .3s ease;
    opacity: 0;

    &.up {
      opacity: 1;
    }
  }
}
</style>
