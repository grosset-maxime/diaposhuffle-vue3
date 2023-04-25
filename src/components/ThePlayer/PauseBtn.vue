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
    class="pause-btn"
    icon
    @click="emit('click')"
    @mouseover="emit('mouseover', $event)"
    @mouseout="emit('mouseout', $event)"
  >
    <div class="pause-icon">
      <div class="stick" />
      <div class="stick" />
    </div>
  </v-btn>
</template>

<style lang="scss" scoped>
.pause-btn {
  // color: #{$grey-0 + 'BB'};
  background-color: #{$grey-7 + '30'};

  .pause-icon {
    display: flex;
    justify-content: center;
    align-items: center;

    .stick {
      width: 5px;
      height: 16px;
      margin: auto 1px;
      background: #{$grey-0 + 'EE'};
      border: 1px solid #{$grey-7 + 'EE'};
    }
  }
}
</style>
