<script setup lang="ts">
// Props
interface Props {
  size?: number;
  width?: number;
  indeterminate?: boolean;
  color?: string;
}
withDefaults(defineProps<Props>(), {
  size: 100,
  width: 10,
  indeterminate: true,
  color: 'orange',
})
</script>

<template>
  <div class="circular-loading">
    <v-progress-circular :size="size" :width="10" :indeterminate="indeterminate" :color="color" />
  </div>
</template>

<style lang="scss" scoped>
.circular-loading {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
