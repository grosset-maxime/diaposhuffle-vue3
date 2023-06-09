<script setup lang="ts">
// Types
import type { DefineComponent } from 'vue'

// Vendors Libs
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'

// Libs
import { routesMap } from '@/router/routes'
import { useKeyboardShortcutsListener } from '@/logic/useKeyboardShortcutsListener'

// Components
import DiapoShuffleHelp from '@/components/TheHelp/DiapoShuffleHelp.vue'

// Stores
import { useMainStore } from '@/stores/mainStore'

const route = useRoute()
const { startKSListener, stopKSListener } = useKeyboardShortcutsListener(keyboardShortcuts)

const pageHelpCmps: {
  [key: string]: DefineComponent<{}, {}, any>;
} = {
  '/diaposhuffle': DiapoShuffleHelp,
}

// Props
interface Props {
  show?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  show: false,
})

// Refs
const { showTheHelp } = useMainStore()

// Computeds
const routePath = computed((): string => route.path)
const helpCmp = computed(() => pageHelpCmps[ routePath.value || '' ])
const routeTitle = computed((): string => routesMap.get(routePath.value)?.title || '')

// Watchs
watch(
  () => props.show,
  (onShow) => {
    if (onShow) {
      startKSListener()
    } else {
      stopKSListener()
    }
  },
)

// Methods
function closeTheHelp () {
  showTheHelp.value = false
}

function keyboardShortcuts (key: string) {
  switch (key) {
  case 'Escape':
  case 'h':
    closeTheHelp()
    break
  default:
  }
}
</script>

<template>
  <!-- <div>Hello The Help: {{ routeTitle }}</div> -->
  <v-dialog
    content-class="the-help"
    :model-value="props.show"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
  >
    <v-card class="the-help-card">
      <v-toolbar density="compact" color="background">
        <v-toolbar-title> Help - {{ routeTitle }} </v-toolbar-title>
        <v-spacer />
        <v-toolbar-items>
          <v-btn icon @click="closeTheHelp">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar-items>
      </v-toolbar>
      <component v-if="props.show" class="help-component-ctn" :is="helpCmp" />
    </v-card>
  </v-dialog>
</template>

<style lang="scss">
$toolbar-height: 48px;

.the-help {
  width: 100vw;
  height: 100vh;
  overflow: hidden;

  .the-help-card {
    height: 100%;
  }

  .help-component-ctn {
    height: calc(100% - #{$toolbar-height});
    display: flex;
    flex-direction: column;
    overflow: auto;
    padding-bottom: 50px;
    @include w-scrollbar;
  }
}
</style>
