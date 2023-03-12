<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

import { useUIOptionsStore } from '@/stores/playerOptions/uiOptions';

const uiOptsStore = useUIOptionsStore();

// Refs
const showHideAll = ref(false);
const pinUnpinAll = ref(false);

// Computeds
const showPath = computed({
  get() {
    return uiOptsStore.isShowPath();
  },
  set(val) {
    uiOptsStore.setShowPath(val);
  },
});
const pinPath = computed({
  get() {
    return uiOptsStore.isPinPath();
  },
  set(val) {
    uiOptsStore.setPinPath(val);
  },
});
const showTags = computed({
  get() {
    return uiOptsStore.isShowTags();
  },
  set(val) {
    uiOptsStore.setShowTags(val);
  },
});
const pinTags = computed({
  get() {
    return uiOptsStore.isPinTags();
  },
  set(val) {
    uiOptsStore.setPinTags(val);
  },
});
const showHistory = computed({
  get() {
    return uiOptsStore.isShowHistory();
  },
  set(val) {
    uiOptsStore.setShowHistory(val);
  },
});
const pinHistory = computed({
  get() {
    return uiOptsStore.isPinHistory();
  },
  set(val) {
    uiOptsStore.setPinHistory(val);
  },
});
const showPined = computed({
  get() {
    return uiOptsStore.isShowPined();
  },
  set(val) {
    uiOptsStore.setShowPined(val);
  },
});
const pinPined = computed({
  get() {
    return uiOptsStore.isPinPined();
  },
  set(val) {
    uiOptsStore.setPinPined(val);
  },
});
const showListIndex = computed({
  get() {
    return uiOptsStore.isShowListIndex();
  },
  set(val) {
    uiOptsStore.setShowListIndex(val);
  },
});
const pinListIndex = computed({
  get() {
    return uiOptsStore.isPinListIndex();
  },
  set(val) {
    uiOptsStore.setPinListIndex(val);
  },
});
const showLoop = computed({
  get() {
    return uiOptsStore.isShowLoop();
  },
  set(val) {
    uiOptsStore.setShowLoop(val);
  },
});
const pinLoop = computed({
  get() {
    return uiOptsStore.isPinLoop();
  },
  set(val) {
    uiOptsStore.setPinLoop(val);
  },
});

const showHideAllLabel = computed(() => {
  return showHideAll.value ? 'Hide all' : 'Show all';
});
const pinUnpinAllLabel = computed(() => {
  return pinUnpinAll.value ? 'Unpin all' : 'Pin all';
});

function toggleShowHideAll(value: boolean) {
  uiOptsStore.toggleShowAll(value);
}

function togglePinUnpinAll(value: boolean) {
  uiOptsStore.togglePinAll(value);
}

function onSwitchShowChange() {
  showHideAll.value =
    showPath.value &&
    showTags.value &&
    showHistory.value &&
    showPined.value &&
    showListIndex.value &&
    showLoop.value;
}

function onSwitchPinChange() {
  pinUnpinAll.value =
    pinPath.value &&
    pinTags.value &&
    pinHistory.value &&
    pinPined.value &&
    pinListIndex.value &&
    pinLoop.value;
}

onMounted(() => {
  onSwitchShowChange();
  onSwitchPinChange();
});
</script>

<template>
  <v-container class="ui-options">
    <v-row align="center">
      <v-col>
        <v-switch
          v-model="showHideAll"
          :label="showHideAllLabel"
          class="ma-0 pa-0"
          hide-details
          inset
          @change="toggleShowHideAll"
        />
      </v-col>
      <v-col>
        <v-switch
          v-model="pinUnpinAll"
          :label="pinUnpinAllLabel"
          class="ma-0 pa-0"
          hide-details
          inset
          @change="togglePinUnpinAll"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col>
        <v-divider class="all-separator" />
      </v-col>
      <v-col>
        <v-divider class="all-separator" />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col>
        <v-switch
          v-model="showPath"
          label="Show path"
          class="ma-0 pa-0"
          hide-details
          inset
          @change="onSwitchShowChange"
        />
      </v-col>
      <v-col>
        <v-switch
          v-model="pinPath"
          label="Pin path"
          class="ma-0 pa-0"
          hide-details
          inset
          @change="onSwitchPinChange"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col>
        <v-switch
          v-model="showTags"
          label="Show tags"
          class="ma-0 pa-0"
          hide-details
          inset
          @change="onSwitchShowChange"
        />
      </v-col>
      <v-col>
        <v-switch
          v-model="pinTags"
          label="Pin tags"
          class="ma-0 pa-0"
          hide-details
          inset
          @change="onSwitchPinChange"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col>
        <v-switch
          v-model="showHistory"
          label="Show history"
          class="ma-0 pa-0"
          hide-details
          inset
          @change="onSwitchShowChange"
        />
      </v-col>
      <v-col>
        <v-switch
          v-model="pinHistory"
          label="Pin history"
          class="ma-0 pa-0"
          hide-details
          inset
          @change="onSwitchPinChange"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col>
        <v-switch
          v-model="showPined"
          label="Show pined"
          class="ma-0 pa-0"
          hide-details
          inset
          @change="onSwitchShowChange"
        />
      </v-col>
      <v-col>
        <v-switch
          v-model="pinPined"
          label="Pin pined"
          class="ma-0 pa-0"
          hide-details
          inset
          @change="onSwitchPinChange"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col>
        <v-switch
          v-model="showListIndex"
          label="Show list index"
          class="ma-0 pa-0"
          hide-details
          inset
          @change="onSwitchShowChange"
        />
      </v-col>
      <v-col>
        <v-switch
          v-model="pinListIndex"
          label="Pin list index"
          class="ma-0 pa-0"
          hide-details
          inset
          @change="onSwitchPinChange"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col>
        <v-switch
          v-model="showLoop"
          label="Show loop"
          class="ma-0 pa-0"
          hide-details
          inset
          @change="onSwitchShowChange"
        />
      </v-col>
      <v-col>
        <v-switch
          v-model="pinLoop"
          label="Pin loop"
          class="ma-0 pa-0"
          hide-details
          inset
          @change="onSwitchPinChange"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
.ui-options {
  .all-separator {
    opacity: 0.4;
  }
  .v-label {
    margin-right: 20px;
  }
}
</style>
