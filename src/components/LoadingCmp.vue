<script setup lang="ts">
interface Props {
  size?: number;
  width?: number;
  color?: string;
  overlay?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 100,
  width: 7,
  color: 'orange',
})
</script>

<template>
  <div class="loading-ctn">
    <v-progress-circular
      class="loading-el"
      :size="props.size"
      :width="props.width"
      :color="props.color"
      indeterminate
    ></v-progress-circular>
    <div v-if="props.overlay" class="overlay"></div>
  </div>
</template>

<style scoped>
.loading-ctn,
.overlay {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
}

.loading-ctn {
  z-index: 10000;
}

.loading-el {
  z-index: 100;
}

.overlay {
  background-color: rgba(50, 50, 50, 0.5);
  backdrop-filter: blur(2px);
  z-index: 1;
}
</style>
