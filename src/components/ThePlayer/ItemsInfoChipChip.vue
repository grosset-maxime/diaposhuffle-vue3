<script setup lang="ts">
// TODO: Feature: On click on the chip show the list of items and allow to navigate through it with arrow key. Also display an item preview.

// Vendors Libs
import { computed } from 'vue'

// Stores
import { usePlayerStore } from '@/stores/player'

// Refs
const playerStore = usePlayerStore()

const emit = defineEmits<{
  (e: 'click'): void;
}>()

const currentItemIndex = computed(() => playerStore.getPlayingIndex() + 1)
</script>

<template>
  <v-chip class="history" small @click="emit('click')">
    {{ currentItemIndex }} / {{ playerStore.getPlayingItemsLength() }}
  </v-chip>
</template>

<style lang="scss" scoped>
.history {
  padding: 0 6px;
  color: $grey-3;
  transition: color 0.3 ease;

  &.v-chip {
    background-color: #{$grey-7 + '80'};
  }

  &:hover {
    color: $grey-0;
  }
}
</style>
