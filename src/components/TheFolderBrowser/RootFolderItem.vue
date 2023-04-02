<script setup lang="ts">
// Types
import type { FolderPath } from '@/stores/folderBrowser'

// Vendors Libs
import { ref, onMounted } from 'vue'

// Stores
import { useFolderBrowserStore } from '@/stores/folderBrowser'

import FolderItem from '@/components/TheFolderBrowser/FolderItem.vue'

const folderBrowserStore = useFolderBrowserStore()
const rootFolder = folderBrowserStore.getRootFolder()
const rootFolderChildren = ref<Array<FolderPath>>(rootFolder.children)

onMounted(async () => {
  rootFolderChildren.value = await folderBrowserStore.fetchChildrenFolders(
    rootFolder.path,
  )
})

</script>

<template>
  <div class="root-folder-item">
    <FolderItem
      v-for="childPath in rootFolderChildren"
      :key="childPath"
      :path="childPath"
    />
  </div>
</template>

<style lang="scss" scoped>
</style>