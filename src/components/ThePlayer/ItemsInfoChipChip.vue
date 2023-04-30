<script setup lang="ts">
// TODO: Feature: On click on the chip show the list of items and allow to navigate
//                through it with arrow key. Also display an item preview.

// Vendors Libs
import { computed } from 'vue'

// Stores
import { useThePlayerStore } from '@/stores/ThePlayer/ThePlayerStore'

const emit = defineEmits<{
  (e: 'click'): void;
}>()

const thePlayerStore = useThePlayerStore()
const itemIndex = computed<number>(() => thePlayerStore.itemIndex.value + 1)
const itemsCount = computed<number>(() => thePlayerStore.itemsCount.value)
</script>

<template>
  <v-chip
    v-if="itemsCount && itemIndex"
    class="items-info-chip"
    small
    @click="emit('click')"
  >
    {{ itemIndex }} / {{ itemsCount }}
  </v-chip>
</template>

<style lang="scss" scoped>
.items-info-chip {
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
