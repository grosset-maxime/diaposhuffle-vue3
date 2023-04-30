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
    class="settings-btn"
    icon
    @click="emit('click')"
    @mouseover="emit('mouseover', $event)"
    @mouseout="emit('mouseout', $event)"
  >
    <v-icon class="settings-icon">mdi-cog</v-icon>
  </v-btn>
</template>

<style lang="scss" scoped>
.settings-btn {
  color: #{$grey-0 + '88'};
  background-color: #{$grey-7 + '30'};

  &:hover {
    color: $grey-0;
  }
}
</style>
