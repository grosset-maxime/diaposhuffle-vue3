<script setup lang="ts">
// TODO: Enh: Prefetch the first level of folders.
// TODO: Feature: Add navigation with arrow keys and select/unselect with enter key.
// TODO: Feature: Add a input search to filter the view.
// TODO: Feature: Add section with 5 or 10 latest selected pathes.
// TODO: Feature: Allow to search a folder by its name which has not been fetch yet (Need a new backend API).

// Types
import type { Fn } from '@vueuse/core';

// Vendors Libs
import { ref, computed, watch } from 'vue';
import { useEventListener } from '@vueuse/core';

import { getKey } from '@/utils/utils';

// Components
import FolderList from '@/components/FolderBrowser/FolderList.vue';

// Props
interface Props {
  show?: boolean;
  selected?: Array<string>;
}
const props = withDefaults(defineProps<Props>(), {
  show: false,
  selected: (): Array<string> => [],
});

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', folders: Array<string>): void;
}>();

let stopKeyboardShortcuts: Fn | null;

// Refs
const selectedFolders = ref<Array<string>>([]);

const FolderListCmp = ref<{ onShow: Function } | null>(null);

// Computeds
const nbSelected = computed(() => selectedFolders.value.length);

// Watchs
watch(
  () => props.show,
  (show) => {
    if (show) {
      onShow();
    } else {
      onHide();
    }
  }
);

function onShow() {
  attachKeyboardShortcuts();

  selectedFolders.value = [...props.selected];

  // Wait for v-dialog transition end before continuing.
  setTimeout(() => {
    FolderListCmp.value?.onShow();
  }, 300);
}

function onHide() {
  removeKeyboardShortcuts();
}

function onConfirm() {
  emit('save', [...selectedFolders.value]);
  onClose();
}

function onCancel() {
  onClose();
}

function onClose() {
  onHide();
  emit('close');
}

function onSelect(path: string) {
  if (!selectedFolders.value.includes(path)) {
    selectedFolders.value.push(path);
  }
}

function onUnSelect(path: string) {
  selectedFolders.value = selectedFolders.value.filter((p) => p !== path);
}

function onUnselectAll() {
  selectedFolders.value = [];
}

function keyboardShortcuts(e: KeyboardEvent) {
  const key = getKey(e);
  let preventDefault = false;
  const stopPropagation = false;

  if (e.altKey) {
    switch (key) {
      // On windows, Meta + Enter does not trigger a keydown event,
      // So, set Alt + Enter to validate.
      case 'Enter':
        onConfirm();
        preventDefault = true;
        break;

      default:
    }
  } else if (e.metaKey) {
    // On windows, Alt + Escape does not trigger a keydown event,
    // So, set Meta + Escape to cancel.
    switch (key) {
      case 'Escape':
        onCancel();
        preventDefault = true;
        break;

      default:
    }
  }

  if (preventDefault) {
    e.preventDefault();
  }
  if (stopPropagation) {
    e.stopPropagation();
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
</script>

<template>
  <v-dialog
    content-class="folder-browser"
    :value="show"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
    persistent
    no-click-animation
  >
    <v-card>
      <v-toolbar>
        <v-btn icon @click="onCancel">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>Folders browser</v-toolbar-title>
        <v-spacer />
        <div v-if="nbSelected" class="nb-selected">Selected: {{ nbSelected }}</div>
        <v-toolbar-items>
          <v-btn v-if="nbSelected" class="unselect-all-btn" text @click="onUnselectAll">
            Unselect All
          </v-btn>
          <v-btn text @click="onConfirm"> Save </v-btn>
        </v-toolbar-items>
      </v-toolbar>

      <div class="ctn">
        <FolderList
          ref="FolderListCmp"
          :selected="selectedFolders"
          @select="onSelect"
          @unselect="onUnSelect"
        />
      </div>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped></style>

<style lang="scss">
.folder-browser {
  .ctn {
    // 56px (v-toolbar-title height) + 24px (v-container padding top + bottom)
    height: calc(100vh - 64px);
    overflow: auto;
    padding: 10px;
    padding-bottom: 40px;
  }

  .nb-selected {
    margin-right: 10px;
  }

  .unselect-all-btn {
    text-transform: none;
    color: $grey-6;
    &:hover {
      color: white;
    }
  }
}
</style>
