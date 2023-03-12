<script setup lang="ts">
// Vendors Libs
import { ref, computed } from 'vue';

import { wait } from '@/utils/utils';

const LOOP_STEP = 100; // In ms.
const LOOP_DETERMINATE_COLOR = '#E87B00CC'; // $orange-1 + light opacity.
const LOOP_INDETERMINATE_COLOR = '#2196f3BB'; // primary color + ligth opacity.
const LOOP_DETERMINATE_HEIGHT = 20;
const LOOP_INDETERMINATE_HEIGHT = 4;
const LOOP_ANIMATION_WAIT = 200; // In ms.

function getTimeText(ms: number, { noMs = false } = {}) {
  const date = new Date(2020, 0, 0);

  date.setMilliseconds(Math.abs(ms));
  const hours = date.getHours();
  const mins = date.getMinutes();
  const seconds = date.getSeconds();
  const dms = date.getMilliseconds();

  let text = '';

  if (hours) {
    text += `${hours}h `;
  }
  if (mins) {
    text += `${mins}m `;
  }
  text += `${seconds}s `;
  if (!noMs && !hours && !mins && seconds < 10) {
    text += `${dms / 100}ms`;
  }

  return text;
}

// Props
interface Props {
  duration?: number;
  dense?: boolean;
  showRemainingTime?: boolean;
  showDurationTime?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  duration: 3000,
  dense: false,
  showRemainingTime: false,
  showDurationTime: false,
});

// Emits
const emit = defineEmits<{
  (e: 'end'): void;
}>();

// Refs
const id = ref();
const value = ref(0);
const indeterminate = ref(true);
const color = ref(LOOP_INDETERMINATE_COLOR);
const striped = ref(false);
const height = ref(LOOP_INDETERMINATE_HEIGHT);

const pause = ref(false);
const stop = ref(false);

const isLooping = ref(false);

const percentage = computed(() => {
  return (value.value * 100) / props.duration;
});

const text = computed(() => {
  let val = '';

  if (props.showRemainingTime) {
    val = remainingTimeText.value;
  }

  if (props.showDurationTime) {
    if (val) {
      val = `${val} / `;
    }
    val = `${val}${durationTimeText.value}`;
  }

  return val;
});

const remainingTimeText = computed(() => {
  return getTimeText(props.duration - value.value);
});

const durationTimeText = computed(() => {
  return getTimeText(props.duration, { noMs: true });
});

const showText = computed(() => {
  return (props.showRemainingTime || props.showDurationTime) && text && !indeterminate.value;
});

function startLooping() {
  stop.value = false;
  pause.value = false;

  clearTimeoutLoop();
  goToLoopStart();
  looop();
}

async function stopLooping() {
  clearTimeoutLoop();

  isLooping.value = false;
  stop.value = true;

  await goToLoopStart();
}

function pauseLooping() {
  isLooping.value = false;
  pause.value = true;

  clearTimeoutLoop();
}

function resumeLooping() {
  if (!pause.value) {
    return;
  }

  pause.value = false;
  stop.value = false;

  looop();
}

function looop() {
  isLooping.value = true;
  clearTimeoutLoop();

  if (stop.value || pause) {
    value.value -= LOOP_STEP;
    return;
  }

  id.value = setTimeout(() => {
    value.value += LOOP_STEP;

    // If loop has not yet reach its end, continue to loop.
    if (value.value <= props.duration) {
      looop();
      return;
    }

    // Add timeout to have feeling that loop reach the end.
    wait({ time: LOOP_ANIMATION_WAIT }).then(() => onLoopEnd());
  }, LOOP_STEP);
}

function clearTimeoutLoop() {
  clearTimeout(id.value);
  id.value = null;
}

async function goToLoopEnd(options = {}) {
  const prevValue = value;

  clearTimeoutLoop();
  value.value = props.duration;

  if (prevValue.value !== props.duration) {
    await wait({ time: LOOP_ANIMATION_WAIT });
  }

  onLoopEnd(options);
}

async function goToLoopStart() {
  const prevValue = value;
  value.value = 0;

  if (prevValue.value) {
    await wait({ time: LOOP_ANIMATION_WAIT });
  }
}

function setIndeterminate(isIndeterminate: boolean) {
  if (isIndeterminate) {
    indeterminate.value = true;
    color.value = LOOP_INDETERMINATE_COLOR;
    height.value = LOOP_INDETERMINATE_HEIGHT;
  } else {
    indeterminate.value = false;
    color.value = LOOP_DETERMINATE_COLOR;
    height.value = LOOP_DETERMINATE_HEIGHT;
  }
}

function onLoopEnd({ noEvent = false } = {}) {
  isLooping.value = false;
  if (!noEvent) {
    emit('end');
  }
}
</script>

<template>
  <v-progress-linear
    class="the-loop"
    :style="{
      transform: dense ? `translateY(${height - 2}px)` : 'translateY(0)',
    }"
    absolute
    bottom
    background-opacity="0.3"
    :value="percentage"
    :color="color"
    :indeterminate="indeterminate"
    :striped="striped"
    :height="height"
    @click="goToLoopStart"
  >
    <span v-if="showText" :class="['text', { dense }]">
      {{ text }}
    </span>
  </v-progress-linear>
</template>

<style lang="scss" scoped>
.the-loop {
  z-index: 1000;

  .text {
    font-size: 0.9em;
    font-weight: bold;
    text-shadow: 0 0 2px black;
    transition: opacity 0.3s ease;

    &.dense {
      opacity: 0;
    }
  }
}
</style>
