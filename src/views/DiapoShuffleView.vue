<script setup lang="ts">
// Stores
import { useGlobalState } from '@/stores';

// Components
import ThePlayerOptions from '@/components/ThePlayerOptions.vue';

// refs
const { toggleTheHelp } = useGlobalState();
</script>

<template>
  <v-layout class="pa-2 flex-column" full-height>
    <v-btn class="help" icon @click="toggleTheHelp">
      <v-icon>mdi-help-circle-outline</v-icon>
    </v-btn>

    <ThePlayerOptions />
  </v-layout>
</template>

<style lang="scss" scoped>
.main-card {
  display: flex;
  flex-direction: column;
}
.help {
  position: absolute;
  right: 10px;
}
.action-bar {
  margin-bottom: 5px;
}
</style>
