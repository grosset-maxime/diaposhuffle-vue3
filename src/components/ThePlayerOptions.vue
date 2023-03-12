<script setup lang="ts">
// Vendors Libs
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { whenever } from '@vueuse/shared';

// Libs
import { useKeyboardShortcutsListener } from '@/composables/keyboardShortcutsListener';

// Stores
import { useGlobalState } from '@/stores';
import { useDiapoShuffleStore } from '@/stores/diapoShuffle';

// Components
import SourceOptions from '@/components/ThePlayerOptions/SourceOptions.vue';
import PlayerOptions from '@/components/ThePlayerOptions/PlayerOptions.vue';
import UIOptions from '@/components/ThePlayerOptions/UIOptions.vue';

const route = useRoute();
const router = useRouter();

// Stores
const { showTheHelp } = useGlobalState();
const { showThePlayer, showFolderBrowser, showTagger } = useDiapoShuffleStore();

const { startListener, stopListener } = useKeyboardShortcutsListener(keyboardShortcuts);

enum TabId {
  source = 'source',
  player = 'player',
  ui = 'ui',
}
const TabIds = Object.values(TabId);
const DEFAULT_TAB_ID = TabId.source;

function getValidTabId(id?: TabId) {
  return id && TabIds.includes(id) ? id : DEFAULT_TAB_ID;
}

// Refs
const hashTabId = computed(() => {
  const hash = route.hash;
  if (!hash) {
    return;
  }
  const hashes = route.hash
    .substring(1)
    .split('/')
    .map((p) => {
      const split = p.split(':');
      return {
        key: split[0],
        value: split[1],
      };
    });
  return hashes.find((p) => p.key === 'tab')?.value as TabId;
});
const tabId = ref(getValidTabId(hashTabId.value)); // Default tab to display.

// Watchs
whenever(hashTabId, (val) => {
  if (tabId.value === val) {
    return;
  }
  tabId.value = getValidTabId(val);
});

watch(tabId, (val) => {
  router.replace({ hash: `#tab:${val}` });
});

watch(
  () => showTheHelp,
  (isShow) => {
    if (isShow) {
      startListener();
    } else if (!showThePlayer.value) {
      stopListener();
    }
  }
);

watch(showThePlayer, (isShow) => {
  isShow ? stopListener() : startListener();
});

watch(showFolderBrowser, (isShow) => {
  isShow ? stopListener() : startListener();
});

watch(showTagger, (isShow) => {
  isShow ? stopListener() : startListener();
});

// Methods
function keyboardShortcuts(key: string) {
  switch (key) {
    case 'Space':
    case 'Enter':
      showThePlayer.value = true;
      break;
    case 'b':
      showFolderBrowser.value = true;
      break;
    case 'h':
      showTheHelp.value = true;
      break;
    case 't':
      showTagger.value = true;
      break;
    default:
  }
}
</script>

<template>
  <v-card v-if="!showThePlayer" class="the-player-options">
    <v-tabs class="tabs" v-model="tabId">
      <v-tab :value="TabId.source" :href="'#tab:' + TabId.source">
        <v-icon left> mdi-file-tree </v-icon>
        Source
      </v-tab>

      <v-tab :value="TabId.player" :href="'#tab:' + TabId.player">
        <v-icon left> mdi-motion-play-outline </v-icon>
        Player
      </v-tab>

      <v-tab :value="TabId.ui" :href="'#tab:' + TabId.ui">
        <v-icon left> mdi-monitor-screenshot </v-icon>
        UI
      </v-tab>
    </v-tabs>

    <v-card-text>
      <v-window v-model="tabId" class="tabs-items">
        <v-window-item :key="TabId.source" :value="TabId.source">
          <SourceOptions />
        </v-window-item>

        <v-window-item :key="TabId.player" :value="TabId.player">
          <PlayerOptions />
        </v-window-item>

        <v-window-item :key="TabId.ui" :value="TabId.ui">
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
