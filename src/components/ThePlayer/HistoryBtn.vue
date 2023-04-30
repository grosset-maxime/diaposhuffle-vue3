<script setup lang="ts">
import { useTheHistoryStore } from '@/stores/ThePlayer/TheHistoryStore'

// Props
interface Props {
  disabled?: boolean;
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

const { count } = useTheHistoryStore()
</script>

<template>
  <v-btn
    class="history-btn"
    :class="{
      disabled,
    }"
    icon
    @click="!disabled && emit('click')"
    @mouseover="emit('mouseover', $event)"
    @mouseout="emit('mouseout', $event)"
  >
    <v-icon class="history-icon">mdi-history</v-icon>
    <span class="count-badge">{{ count }}</span>
  </v-btn>
</template>

<style lang="scss" scoped>
.history-btn {
  color: #{$grey-0 + '88'};
  background-color: #11111188;

  &.disabled {
    cursor: not-allowed;
  }

  &:hover:not(.disabled) {
    color: $grey-0;
  }

  .count-badge {
    font-size: 11px;
    position: absolute;
    bottom: 2px;
  }
}
</style>
