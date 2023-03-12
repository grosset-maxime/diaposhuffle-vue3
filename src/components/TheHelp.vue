<script setup lang="ts">
// Types
import type { DefineComponent } from 'vue';
import type { Fn } from '@vueuse/core';

// Vendors Libs
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useEventListener } from '@vueuse/core';

// Libs
import { getKey } from '@/utils/utils';
import { routesMap } from '@/router/routes';

// Components
import DiapoShuffleHelp from '@/components/Helps/DiapoShuffleHelp.vue';

// Stores
import { useGlobalState } from '@/stores';

let stopKeyboardShortcuts: Fn;
const route = useRoute();

const pageHelpCmps: {
  [key: string]: DefineComponent<{}, {}, any>;
} = {
  '/diaposhuffle': DiapoShuffleHelp,
};

// Props
interface Props {
  show?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  show: false,
});

// Refs
const { toggleTheHelp } = useGlobalState();

// Computeds
const routePath = computed((): string => route.path);
const helpCmp = computed(() => pageHelpCmps[routePath.value || '']);
const routeTitle = computed((): string => routesMap.get(routePath.value)?.title || '');

// Watchs
watch(
  () => props.show,
  (onShow) => {
    if (onShow) {
      attachKeyboardShortcuts();
    } else {
      removeKeyboardShortcuts();
    }
  }
);

// Methods
function closeTheHelp() {
  toggleTheHelp(false);
}

function keyboardShortcuts(e: KeyboardEvent) {
  // console.log('TheHelp e:', e);

  const key = getKey(e);
  switch (key) {
    case 'Escape':
    case 'h':
      closeTheHelp();
      break;
    default:
  }
}

function attachKeyboardShortcuts() {
  stopKeyboardShortcuts = useEventListener(document, 'keydown', keyboardShortcuts);
}

function removeKeyboardShortcuts() {
  stopKeyboardShortcuts && stopKeyboardShortcuts();
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
      <v-toolbar height="56">
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
$toolbar-height: 56px;

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
