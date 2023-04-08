<script setup lang="ts">
// Vendors Libs
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { whenever } from '@vueuse/shared'

// Libs
import { useKeyboardShortcutsListener } from '@/composables/keyboardShortcutsListener'

// Stores
import { useGlobalState } from '@/stores'
import { useDiapoShuffleStore } from '@/stores/diapoShuffle'

// Components
import SourceOptions from '@/components/ThePlayerOptions/SourceOptions.vue'
import PlayerOptions from '@/components/ThePlayerOptions/PlayerOptions.vue'
import UIOptions from '@/components/ThePlayerOptions/UIOptions.vue'

const route = useRoute()
const router = useRouter()

// Stores
const { showTheHelp } = useGlobalState()
const { showThePlayer, showFolderBrowser, showTagger } = useDiapoShuffleStore()

const { startKSListener, stopKSListener } = useKeyboardShortcutsListener(keyboardShortcuts)

enum TabId {
  source = 'source',
  player = 'player',
  ui = 'ui',
}
const TabIds = Object.values(TabId)
const DEFAULT_TAB_ID = TabId.source

function getValidTabId (id?: TabId) {
  return id && TabIds.includes(id)
    ? id
    : DEFAULT_TAB_ID
}

// Refs
const hashTabId = computed(() => {
  const hash = route.hash
  if (!hash) {
    return
  }
  const hashes = route.hash
    .substring(1)
    .split('/')
    .map((p) => {
      const split = p.split(':')
      return {
        key: split[ 0 ],
        value: split[ 1 ],
      }
    })
  return hashes.find((p) => p.key === 'tab')?.value as TabId
})
const tabId = ref(getValidTabId(hashTabId.value)) // Default tab to display.

// Watchs
whenever(hashTabId, (val) => {
  if (tabId.value === val) {
    return
  }
  tabId.value = getValidTabId(val)
}, { flush: 'post' })

watch(tabId, (val) => {
  router.replace({ hash: `#tab:${val}` })
})

watch(
  [ showTheHelp, showFolderBrowser, showTagger ],
  (isShow) => {
    isShow
      ? stopKSListener()
      : startKSListener()
  },
)

// Methods
function startPlayer () {
  showThePlayer.value = true
}

function keyboardShortcuts (key: string) {
  switch (key) {
  case 'Space':
  case 'Enter':
    startPlayer()
    break
  case 'b':
    showFolderBrowser.value = true
    break
  case 'h':
    showTheHelp.value = true
    break
  case 't':
    showTagger.value = true
    break
  default:
  }
}
</script>

<template>
  <v-card class="the-player-options">
    <v-tabs
      v-model="tabId"
      class="tabs"
      color="primary"
      bg-color="#111111A0"
      height="48"
    >
      <v-tab :value="TabId.source">
        <v-icon left start size="large">mdi-file-tree</v-icon>
        Source
      </v-tab>

      <v-tab :value="TabId.player">
        <v-icon left start size="large">mdi-motion-play-outline</v-icon>
        Player
      </v-tab>

      <v-tab :value="TabId.ui">
        <v-icon left start size="large">mdi-monitor-screenshot</v-icon>
        UI
      </v-tab>
    </v-tabs>

    <v-window v-model="tabId" class="tabs-content-ctn scrollable">
      <v-window-item class="tab-content-ctn" :key="TabId.source" :value="TabId.source">
        <SourceOptions />
      </v-window-item>

      <v-window-item class="tab-content-ctn" :key="TabId.player" :value="TabId.player">
        <PlayerOptions />
      </v-window-item>

      <v-window-item class="tab-content-ctn" :key="TabId.ui" :value="TabId.ui">
        <UIOptions />
      </v-window-item>
    </v-window>

    <div class="start-btn-ctn">
      <v-btn class="start-btn" color="primary" @click="startPlayer">
        Start
      </v-btn>
    </div>
  </v-card>
</template>

<style lang="scss" scoped>
$start-btn-height: 36px;
$start-btn-bottom: 8px;

.the-player-options {
  height: 100%;
  margin-right: 5px;
  padding-top: 0px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.tabs {
  min-height: #{settings.$tabs-height}
}
.tabs-content-ctn {
  height: 100%;
}
.tab-content-ctn {
  padding-bottom: $start-btn-height + $start-btn-bottom;
}
.scrollable {
  @include w-scrollbar(auto, hidden);
}

.start-btn-ctn {
  position: absolute;
  bottom: 8px;
  left: 25%;
  display: flex;

  .start-btn {
    width: 50vw;
  }
}
</style>
