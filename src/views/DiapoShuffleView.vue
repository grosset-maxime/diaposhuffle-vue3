<script setup lang="ts">
// Components
import ThePlayerOptions from '@/components/ThePlayerOptions.vue'

import { useTaggerStore } from '@/stores/tagger'

// To pre-fetch tags and categories list.
useTaggerStore()

</script>

<template>
  <v-layout class="pa-2 flex-column" full-height>
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
