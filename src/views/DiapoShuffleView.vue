<script setup lang="ts">
// Components
import ThePlayerOptions from '@/components/ThePlayerOptions/ThePlayerOptions.vue'
import ThePlayer from '@/components/ThePlayer/ThePlayer.vue'

import { useDiapoShuffleStore } from '@/stores/diapoShuffleStore'
import { useTheTaggerStore } from '@/stores/TheTaggerStore'

const { showThePlayer } = useDiapoShuffleStore()

// To pre-fetch tags and categories list.
const theTaggerStore = useTheTaggerStore()
theTaggerStore.initStore()
</script>

<template>
  <v-layout class="pa-2 flex-column" full-height>
    <ThePlayerOptions v-if="!showThePlayer"/>

    <Teleport to="body">
      <ThePlayer v-if="showThePlayer" />
    </Teleport>
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
