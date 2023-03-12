<script setup lang="ts">
// TODO: Feature: Add an option to play in infinite loop for video item.

// Vendors Libs
import { computed } from 'vue';

// Stores
import { usePlayerOptionsStore } from '@/stores/playerOptions/playerOptions';

const playerOptsStore = usePlayerOptionsStore();

// Computeds
const interval = computed({
  get() {
    return playerOptsStore.getInterval();
  },
  set(interval) {
    playerOptsStore.setInterval(interval);
  },
});

const isMuteVideoComputed = computed({
  get() {
    return playerOptsStore.isMuteVideo();
  },
  set(muteVideo) {
    playerOptsStore.setIsMuteVideo(muteVideo);
  },
});

const isFetchItemRandomlyComputed = computed({
  get() {
    return playerOptsStore.isFetchItemRandomly();
  },
  set(fetchItemRandomly) {
    playerOptsStore.setIsFetchItemRandomly(fetchItemRandomly);
  },
});
</script>

<template>
  <v-container class="player-options">
    <v-row class="mt-4" align="center">
      <v-col class="interval-col">
        <v-slider
          v-model="interval"
          min="1"
          max="60"
          label="Interval"
          @click:append="playerOptsStore.resetInterval()"
          append-icon="mdi-close"
          thumb-label="always"
          thumb-size="24"
          hint="1 - 60 seconds"
          persistent-hint
          ticks="1"
          dense
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col>
        <v-switch
          v-model="isMuteVideoComputed"
          label="Mute video"
          class="ma-0 pa-0"
          hide-details
          inset
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col>
        <v-switch
          v-model="isFetchItemRandomlyComputed"
          label="Fetch Item Randomly"
          class="ma-0 pa-0"
          hide-details
          inset
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
.player-options {
  .interval-col {
    padding-right: 20%;
  }

  .v-label {
    margin-right: 20px;
  }
}
</style>
