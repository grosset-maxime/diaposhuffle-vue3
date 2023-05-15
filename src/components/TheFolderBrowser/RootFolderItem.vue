<script setup lang="ts">
// Types
import type { FolderPath } from '@/stores/TheFolderBrowserStore'

// Vendors Libs
import { ref, onMounted } from 'vue'

// Stores
import { useTheFolderBrowserStore } from '@/stores/TheFolderBrowserStore'

import FolderItem from '@/components/TheFolderBrowser/FolderItem.vue'

const theFolderBrowserStore = useTheFolderBrowserStore()
const rootFolder = theFolderBrowserStore.getRootFolder()
const rootFolderChildren = ref<Array<FolderPath>>(rootFolder.children)

onMounted(async () => {
  rootFolderChildren.value = await theFolderBrowserStore.fetchChildrenFolders(
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