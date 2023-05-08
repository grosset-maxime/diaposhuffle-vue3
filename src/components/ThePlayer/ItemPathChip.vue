<script setup lang="ts">
// TODO: Feature: On click add to clipboard the path of the item.

import { computed } from 'vue'
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'

const { item } = useThePlayerStore()

const pathStart = computed<string>(() => item.value?.customFolderPath || '')
const pathEnd = computed<string>(() => item.value?.randomPublicPath || '.')

// Emits
const emit = defineEmits<{
  (e: 'click'): void;
}>()
</script>

<template>
  <div class="item-path-chip" @click="emit('click')">
    <span class="path-start">
      {{ pathStart }}
    </span>

    <span class="path-end">
      {{ pathEnd }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.item-path-chip {
  word-break: break-all;
  color: $grey-3;
  background-color: #{$grey-7 + '80'};
  padding: 0 3px;
  border-radius: 5px;
  cursor: text;

  &:hover {
    color: $grey-0;
  }

  .path-start {
    font-size: 0.8em;
    margin-right: 4px;
  }

  .path-end {
    font-size: 1em;
    font-weight: bold;
  }
}
</style>
