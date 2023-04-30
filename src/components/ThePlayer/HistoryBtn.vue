<script setup lang="ts">
// Emits
const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'mouseover', event: MouseEvent): void;
  (e: 'mouseout', event: MouseEvent): void;
}>()
</script>

<template>
  <v-btn
    class="history-btn"
    icon
    @click="emit('click')"
    @mouseover="emit('mouseover', $event)"
    @mouseout="emit('mouseout', $event)"
  >
    <v-icon class="history-icon">mdi-history</v-icon>
  </v-btn>
</template>

<style lang="scss" scoped>
.history-btn {
  color: #{$grey-0 + '88'};
  background-color: #{$grey-7 + '30'};

  &:hover {
    color: $grey-0;
  }
}
</style>
