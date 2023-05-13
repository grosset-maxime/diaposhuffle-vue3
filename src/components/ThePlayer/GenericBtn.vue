<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

// Props
interface Props {
  disabled?: boolean
}
withDefaults(defineProps<Props>(), {
  disabled: false,
})

// Emits
const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'mouseover', event: MouseEvent): void;
  (e: 'mouseout', event: MouseEvent): void;
}>()

const isMouseOver = ref(false)

function onMouseOver (e: MouseEvent): void {
  isMouseOver.value = true
  emit('mouseover', e)
}
function onMouseOut (e: MouseEvent): void {
  isMouseOver.value = false
  emit('mouseout', e)
}

onBeforeUnmount(() => {
  isMouseOver.value && onMouseOut(new MouseEvent('mouseout'))
})
</script>

<template>
  <v-btn
    class="generic-btn"
    :class="{
      disabled,
    }"
    icon
    @click="!disabled && emit('click')"
    @mouseover="onMouseOver"
    @mouseout="onMouseOut"
  >
    <slot />
  </v-btn>
</template>

<style lang="scss" scoped>
.generic-btn {
  color: #{$grey-0 + '88'};
  background-color: #11111188;

  &.disabled {
    cursor: not-allowed;
  }

  &:hover:not(.disabled) {
    color: $grey-0;
  }
}
</style>
