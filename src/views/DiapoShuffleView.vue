<script setup lang="ts">
// Components
import ThePlayerOptions from '@/components/ThePlayerOptions/ThePlayerOptions.vue'
import ThePlayer from '@/components/ThePlayer/ThePlayer.vue'

import { useDiapoShuffleStore } from '@/stores/diapoShuffleStore'
import { useTheTaggerStore } from '@/stores/TheTaggerStore'
import { useAlertStore } from '@/stores/alertStore'
import { createAlert } from '@/utils/alertUtils'
import { createCustomError } from '@/models/customError'
import { logError } from '@/utils/errorUtils'

const { showThePlayer } = useDiapoShuffleStore()

const alertStore = useAlertStore()

// To pre-fetch tags and categories list.
const theTaggerStore = useTheTaggerStore()

theTaggerStore.initStore()
  .catch((error) => {
    const customError = logError(createCustomError(error, {
      file: 'views/DiapoShuffleView.vue',
      actionName: 'script',
    }))

    alertStore.add(createAlert({ error: customError }))
  })
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
