<script setup lang="ts">
// TODO: Feature: save in user preferences (bdd or localstorage) the choosen options.

// Types
import type { Fn } from '@vueuse/core';

// Vendors Libs
import { ref, watch, onMounted } from 'vue';
import { useEventListener } from '@vueuse/core';

// Libs
import { getKey } from '@/utils/utils';

// Stores
import { useGlobalState } from '@/stores';

// Components
import SourceOptions from '@/components/ThePlayerOptions/SourceOptions.vue';
import PlayerOptions from '@/components/ThePlayerOptions/PlayerOptions.vue';
import UIOptions from '@/components/ThePlayerOptions/UIOptions.vue';

let stopKeyboardShortcuts: Fn | null;

// Refs
const tab = ref('source'); // Default tab to display.
const { isTheHelpShown, isThePlayerShown, toggleTheHelp, setShowThePlayer } = useGlobalState();

const sourceOptionsCmp = ref<{ showFolderBrowser: Function; showTaggerModal: Function } | null>(
  null
);

// Watchs
watch(
  () => isTheHelpShown(),
  (onShow) => {
    if (onShow) {
      removeKeyboardShortcuts();
    } else if (!isThePlayerShown()) {
      attachKeyboardShortcuts();
    }
  }
);

watch(
  () => isThePlayerShown(),
  (onShow) => {
    if (onShow) {
      removeKeyboardShortcuts();
    } else if (!isThePlayerShown()) {
      attachKeyboardShortcuts();
    }
  }
);

// Methods
function showFolderBrowser() {
  sourceOptionsCmp.value?.showFolderBrowser();
}

function onShowFolderBrowser() {
  removeKeyboardShortcuts();
}

function onHideFolderBrowser() {
  attachKeyboardShortcuts();
}

function showTaggerModal() {
  sourceOptionsCmp.value?.showTaggerModal();
}

function onShowTaggerModal() {
  removeKeyboardShortcuts();
}

function onHideTaggerModal() {
  attachKeyboardShortcuts();
}

function keyboardShortcuts(e: KeyboardEvent) {
  // console.log('TheHelp e:', e);

  const key = getKey(e);

  switch (key) {
    case 'Space':
    case 'Enter':
      setShowThePlayer(true);
      break;
    case 'b':
      showFolderBrowser();
      break;
    case 'h':
      toggleTheHelp();
      break;
    case 't':
      showTaggerModal();
      break;
    default:
  }
}

function attachKeyboardShortcuts() {
  if (stopKeyboardShortcuts) {
    return;
  }
  stopKeyboardShortcuts = useEventListener(document, 'keydown', keyboardShortcuts);
}

function removeKeyboardShortcuts() {
  stopKeyboardShortcuts && stopKeyboardShortcuts();
  stopKeyboardShortcuts = null;
}

onMounted(() => attachKeyboardShortcuts());
</script>

<template>
  <v-card class="the-player-options">
    <v-tabs class="tabs" v-model="tab">
      <v-tab value="source" href="#source">
        <v-icon left> mdi-file-tree </v-icon>
        Source
      </v-tab>

      <v-tab value="player" href="#player">
        <v-icon left> mdi-motion-play-outline </v-icon>
        Player
      </v-tab>

      <v-tab value="ui" href="#ui">
        <v-icon left> mdi-monitor-screenshot </v-icon>
        UI
      </v-tab>
    </v-tabs>

    <v-card-text>
      <v-window v-model="tab" class="tabs-items">
        <v-window-item key="1" value="source">
          <SourceOptions
            ref="sourceOptionsCmp"
            @showFolderBrowser="onShowFolderBrowser"
            @hideFolderBrowser="onHideFolderBrowser"
            @showTaggerModal="onShowTaggerModal"
            @hideTaggerModal="onHideTaggerModal"
          />
        </v-window-item>

        <v-window-item key="2" value="player">
          <PlayerOptions />
        </v-window-item>

        <v-window-item key="3" value="ui">
          <UIOptions />
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.the-player-options {
  height: 100%;
  overflow: auto;
  margin-right: 5px;
  padding-top: 3px;
  @include w-scrollbar;

  .tabs {
    border-radius: 5px;
  }

  .tabs-items {
    background-color: transparent;
    padding-top: 6px;
  }
}
</style>
