<script setup lang="ts">
// TODO: Feature: Add an option to play in infinite loop for video item.

// Stores
import { usePlayerOptionsStore } from '@/stores/ThePlayerOptions/playerOptions'

const { interval, isMuteVideo, isFetchItemRandomly, resetInterval } = usePlayerOptionsStore()
</script>

<template>
  <v-container class="player-options">
    <v-row class="mt-4" align="center">
      <v-col class="interval-col">
        <v-slider
          v-model="interval"
          min="1"
          max="60"
          step="1"
          label="Interval"
          thumb-label="always"
          thumb-size="24"
          thumb-color="primary"
          track-color="secondary"
          track-fill-color="primary"
          messages="1 - 60 seconds"
          show-ticks
          tick-size="4"
        >
        <template v-slot:append>
          <v-text-field
            v-model="interval"
            type="number"
            style="width: 80px"
            density="compact"
            hide-details
            variant="outlined"
            min="1"
            max="60"
          ></v-text-field>
          <v-btn
            variant="text"
            icon="mdi-close"
            @click="resetInterval"
          ></v-btn>
        </template>
      </v-slider>
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col class="col-switch">
        <v-switch
          v-model="isMuteVideo"
          label="Mute video"
          color="primary"
          density="compact"
          hide-details
          inset
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col class="col-switch">
        <v-switch
          v-model="isFetchItemRandomly"
          label="Fetch Item Randomly"
          class="ma-0 pa-0"
          color="primary"
          density="compact"
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
.col-switch {
  padding: 6px 12px
}
</style>
