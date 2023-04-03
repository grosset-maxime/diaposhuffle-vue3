<script setup lang="ts">
// Types
import type { FolderPath } from '@/stores/folderBrowser'

// Vendors Libs
import { ref, computed, inject } from 'vue'

// Stores
import { useFolderBrowserStore } from '@/stores/folderBrowser'
import { theFolderBrowserKey } from '@/interfaces/symbols'

// Props
interface Props {
  path: FolderPath
}
const props = defineProps<Props>()

const selectedFoldersModal = inject(theFolderBrowserKey)
if (!selectedFoldersModal) {
  throw new Error(`Could not resolve ${theFolderBrowserKey.description}`)
}
const {
  selectedFolders,
  addSelectedFolder,
  removeSelectedFolder,
} = selectedFoldersModal

const folderBrowserStore = useFolderBrowserStore()

const folderChildren = ref<Array<FolderPath> | undefined>()
const selected = computed(() => selectedFolders.value.has(props.path))
const expanded = ref(false)

// Computeds
const folder = computed(() => folderBrowserStore.getFolder(props.path))
const hasChildren = computed(() => !!folder.value?.children.length)
const noExpand = computed(() => !!(!hasChildren.value && folder.value?.fetched))

// Metods
async function expandFolder () {
  if (!folder.value || noExpand.value) { return }

  expanded.value = !expanded.value
  folderChildren.value = await folderBrowserStore.fetchChildrenFolders(props.path)
}

function toggleSelect () {
  if (!selected.value) {
    addSelectedFolder(props.path)
  } else {
    removeSelectedFolder(props.path)
  }
}

function onFolderItemClick (e: MouseEvent) {
  if (e.target === e.currentTarget) {
    toggleSelect()
  }
}
</script>

<template>
  <div v-if="folder" class="folder-item">
    <div
      class="folder"
      @click="onFolderItemClick"
    >
      <v-btn
        v-if="!noExpand"
        class="expand-btn"
        :class="{
          expanded: expanded
        }"
        width="24"
        min-width="24"
        height="24"
        color="primary"
        @click="expandFolder"
      >
        <v-progress-circular
          v-if="folder.fetching"
          size="15"
          width="1"
          color="white"
          indeterminate
        />
        <v-icon
          class="plus-icon"
          color="white"
          v-show="!folder.fetching"
        >
          mdi-plus
        </v-icon>
        <v-icon
          class="minus-icon"
          color="white"
          v-show="!folder.fetching"
        >
          mdi-minus
        </v-icon>
      </v-btn>
      <div v-if="noExpand" class="no-expand" />

      <v-checkbox
        class="checkbox"
        :true-value="true"
        :false-value="false"
        v-model="selected"
        hide-details
        color="blue"
      />

      <div class="folder-name" @click="toggleSelect">{{ folder.name }}</div>
    </div>
    <div
      v-if="folderChildren || noExpand"
      class="sub-folders-ctn"
      :class="{
        hide: !expanded
      }"
    >
      <FolderItem
        v-for="childPath in folderChildren"
        :key="childPath"
        :path="childPath"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$folder-padding-left: 5px;

.folder-item {
  cursor: pointer;

  .expand-btn {
    padding: 0 12px;
    margin-right: 0px;

    &.expanded {
      .plus-icon {
        display: none;
      }
      .minus-icon {
        display: block;
      }
    }

    .plus-icon {
      display: block;
    }
    .minus-icon {
      display: none;
    }
  }
  .no-expand {
    width: 24px;
    height: 24px;
    background-color: $primary;
    opacity: .2;
    border-radius: 5px;
  }

  .folder {
    padding-left: $folder-padding-left;
    display: flex;
    align-items: center;
    height: 40px;

    &:hover {
      background-color: $grey-8;
    }

    .name {
      cursor: pointer;
    }
  }

  .sub-folders-ctn {
    padding-left: 12px;
    margin-left: #{12px + $folder-padding-left};
    border-left: 1px dashed $grey-6;

    &.hide {
      display: none;
    }
  }
}
.checkbox {
  width: 40px;
  max-width: 40px;
}
</style>
