<script setup lang="ts">
import { eagerComputed } from '@vueuse/shared'

import { useUIOptionsStore } from '@/stores/ThePlayerOptions/uiOptionsStore'

const {
  showListIndex,
  showLoop,
  showPath,
  showPined,
  showTags,
  pinListIndex,
  pinLoop,
  pinPath,
  pinPined,
  pinTags,
  togglePinAll,
  toggleShowAll,
} = useUIOptionsStore()

// Computeds
const showHideAll = eagerComputed(
  () =>
    showPath.value
    && showTags.value
    && showPined.value
    && showListIndex.value
    && showLoop.value,
)
const pinUnpinAll = eagerComputed(
  () =>
    pinPath.value
    && pinTags.value
    && pinPined.value
    && pinListIndex.value
    && pinLoop.value,
)
</script>

<template>
  <v-container class="ui-options">
    <v-row align="center">
      <v-col class="col d-flex">
        <span class="v-label">Hide all</span>
        <v-switch
          :model-value="showHideAll"
          label="Show all"
          color="blue"
          hide-details
          inset
          density="compact"
          @change="toggleShowAll(!showHideAll)"
        />
      </v-col>
      <v-col class="col d-flex">
        <span class="v-label">Unpin all</span>
        <v-switch
          :model-value="pinUnpinAll"
          label="Pin all"
          color="blue"
          hide-details
          inset
          density="compact"
          @change="togglePinAll(!pinUnpinAll)"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col class="col">
        <v-divider class="all-separator" />
      </v-col>
      <v-col class="col">
        <v-divider class="all-separator" />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col class="col">
        <v-switch
          v-model="showPath"
          label="Show path"
          color="primary"
          hide-details
          inset
          density="compact"
        />
      </v-col>
      <v-col class="col">
        <v-switch
          v-model="pinPath"
          label="Pin path"
          color="primary"
          hide-details
          inset
          density="compact"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col class="col">
        <v-switch
          v-model="showTags"
          label="Show tags"
          color="primary"
          hide-details
          inset
          density="compact"
        />
      </v-col>
      <v-col class="col">
        <v-switch
          v-model="pinTags"
          label="Pin tags"
          color="primary"
          hide-details
          inset
          density="compact"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col class="col">
        <v-switch
          v-model="showPined"
          label="Show pined"
          color="primary"
          hide-details
          inset
          density="compact"
        />
      </v-col>
      <v-col class="col">
        <v-switch
          v-model="pinPined"
          label="Pin pined"
          color="primary"
          hide-details
          inset
          density="compact"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col class="col">
        <v-switch
          v-model="showListIndex"
          label="Show list index"
          color="primary"
          hide-details
          inset
          density="compact"
        />
      </v-col>
      <v-col class="col">
        <v-switch
          v-model="pinListIndex"
          label="Pin list index"
          color="primary"
          hide-details
          inset
          density="compact"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col class="col">
        <v-switch
          v-model="showLoop"
          label="Show loop"
          color="primary"
          hide-details
          inset
          density="compact"
        />
      </v-col>
      <v-col class="col">
        <v-switch
          v-model="pinLoop"
          label="Pin loop"
          color="primary"
          hide-details
          inset
          density="compact"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
.all-separator {
  opacity: 0.4;
}
.v-label {
  margin-right: 10px;
}
.col {
  padding: 4px 12px;
}
</style>
