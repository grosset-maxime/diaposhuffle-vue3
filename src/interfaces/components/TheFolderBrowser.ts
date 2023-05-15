import type { Ref } from 'vue'
import type { FolderPath } from '@/stores/TheFolderBrowserStore'

export interface TheFolderBrowser {
  selectedFolders: Ref<Set<FolderPath>>
  addSelectedFolder: (path: FolderPath) => void
  removeSelectedFolder: (path: FolderPath) => void
}