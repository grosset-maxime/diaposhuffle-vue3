<script setup lang="ts">
// TODO: Feature: On click on the chip show the list of history and allow to
//                navigate through it with arrow key. Also display an item preview.

// Types
import type { Item } from '@/models/item'

// Vendors Libs
import { computed } from 'vue'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'

const emit = defineEmits<{
  (e: 'click'): void;
}>()

// Refs
const playerStore = useThePlayerStore()

// Computeds
const historyIndex = computed(() => playerStore.getHistoryIndex() + 1)

const currentItemCount = computed(() => {
  let count = 0
  const historyItem = playerStore.getHistoryItemAt(historyIndex.value)

  if (historyItem) {
    playerStore.getHistoryItems().forEach((item: Item) => {
      if (item.src === historyItem.src) {
        count += 1
      }
    })
  }

  return count
})
</script>

<template>
  <v-chip class="history" small @click="emit('click')">
    {{ historyIndex }} / {{ playerStore.getHistoryLength() }} | {{ currentItemCount }}
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
