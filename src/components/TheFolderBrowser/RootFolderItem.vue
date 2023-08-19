<script setup lang="ts">
// Types
import type { FolderPath } from '@/stores/TheFolderBrowserStore'

// Vendors Libs
import { ref, onMounted } from 'vue'

// Stores
import { useTheFolderBrowserStore } from '@/stores/TheFolderBrowserStore'

import FolderItem from '@/components/TheFolderBrowser/FolderItem.vue'
import { createCustomError, CustomError, type CustomErrorData } from '@/models/customError'
import { logError } from '@/utils/errorUtils'
import { createAlert } from '@/utils/alertUtils'
import { useAlertStore } from '@/stores/alertStore'

const alertStore = useAlertStore()
const theFolderBrowserStore = useTheFolderBrowserStore()
const rootFolder = theFolderBrowserStore.getRootFolder()
const rootFolderChildren = ref<Array<FolderPath>>(rootFolder.children)

function onError (error: unknown, errorData?: CustomErrorData): CustomError {
  const customError = createCustomError(error, {
    ...errorData,
    file: 'TheFolderBrowser/RootFolderItem.vue',
  })
  logError(customError)

  const customAlert = createAlert({ error: customError })

  alertStore.add(customAlert)

  return customError
}

onMounted(async () => {
  try {
    rootFolderChildren.value = await theFolderBrowserStore.fetchChildrenFolders(
      rootFolder.path,
    )
  } catch (e) {
    onError(e, { actionName: 'RootFolderItem#onMounted' })
  }
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