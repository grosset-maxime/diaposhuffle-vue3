<script setup lang="ts">
// TODO: Enh: Prefetch the first level of folders.
// TODO: Feature: Add navigation with arrow keys and select/unselect with enter key.
// TODO: Feature: Add a input search to filter the view.
// TODO: Feature: Add section with 5 or 10 latest selected pathes.
// TODO: Feature: Allow to search a folder by its name which has not been fetch yet
//                (Need a new backend API).
// TODO: Enh: Do not use v-dialog to be able to keep alive the display (expanded)
//            of folders after closing and reopening the folder browser

// Types
import type { FolderPath } from '@/stores/folderBrowser'
import { theFolderBrowserKey } from '@/interfaces/symbols'

// Vendors Libs
import { ref, computed, watch, provide } from 'vue'

import { useKeyboardShortcutsListener } from '@/composables/keyboardShortcutsListener'

// Components
import RootFolderItem from '@/components/TheFolderBrowser/RootFolderItem.vue'

// Props
interface Props {
  show?: boolean;
  selected?: Set<FolderPath>;
}
const props = withDefaults(defineProps<Props>(), {
  show: false,
  selected: (): Set<FolderPath> => new Set(),
})

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', folders: Set<FolderPath>): void;
}>()

const { startListener, stopListener } = useKeyboardShortcutsListener(keyboardShortcuts)

// Refs
const selectedFolders = ref<Set<FolderPath>>(new Set(props.selected))

// Computeds
const nbSelected = computed(() => selectedFolders.value.size)

// Watchs
watch(
  () => props.show,
  (show) => {
    if (show) {
      onShow()
    } else {
      onHide()
    }
  },
)

//#region Methods
function onShow () {
  startListener()
  selectedFolders.value = new Set(props.selected)
}

function onHide () {
  stopListener()
}

function onConfirm () {
  emit('save', new Set(selectedFolders.value))
  onClose()
}

function onCancel () {
  onClose()
}

function onClose () {
  onHide()
  emit('close')
}

function addSelectedFolder (path: FolderPath) {
  selectedFolders.value.add(path)
}

function removeSelectedFolder (path: FolderPath) {
  selectedFolders.value.delete(path)
}

function onUnselectAll () {
  selectedFolders.value = new Set()
}

function keyboardShortcuts (key: string, e: KeyboardEvent) {
  let preventDefault = false
  const stopPropagation = false

  if (e.altKey) {
    switch (key) {
    // On windows, Meta + Enter does not trigger a keydown event,
    // So, set Alt + Enter to validate.
    case 'Enter':
      onConfirm()
      preventDefault = true
      break

    default:
    }
  } else if (e.metaKey) {
    // On windows, Alt + Escape does not trigger a keydown event,
    // So, set Meta + Escape to cancel.
    switch (key) {
    case 'Escape':
      onCancel()
      preventDefault = true
      break

    default:
    }
  }

  if (preventDefault) {
    e.preventDefault()
  }
  if (stopPropagation) {
    e.stopPropagation()
  }
}
//#endregion Methods

provide(theFolderBrowserKey, {
  selectedFolders,
  addSelectedFolder,
  removeSelectedFolder,
})
</script>

<template>
  <v-dialog
    content-class="the-folder-browser"
    :model-value="show"
    fullscreen
    transition="dialog-bottom-transition"
    persistent
    no-click-animation
  >
    <v-card>
      <v-toolbar class="folder-browser-modal-toolbar" density="compact" color="background">
        <v-btn icon @click="onCancel">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>Folders browser</v-toolbar-title>
        <v-spacer />
        <div v-if="!!nbSelected" class="nb-selected">Selected: {{ nbSelected }}</div>
        <v-toolbar-items>
          <v-btn v-if="!!nbSelected" class="unselect-all-btn" text @click="onUnselectAll">
            Unselect All
          </v-btn>
          <v-btn text @click="onConfirm">Save</v-btn>
        </v-toolbar-items>
      </v-toolbar>

      <div class="ctn">
        <RootFolderItem />
      </div>
    </v-card>
  </v-dialog>
</template>

<style lang="scss">
$v-toolbar-height: 48px;

.the-folder-browser {
  .ctn {
    height: calc(100% - #{$v-toolbar-height});
    overflow: auto;
    padding: 5px;
  }

  .folder-browser-modal-toolbar {
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
}
</style>