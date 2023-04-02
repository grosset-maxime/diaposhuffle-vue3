import type { Ref } from 'vue'
import type { FolderPath } from '@/stores/folderBrowser'

export interface TheFolderBrowser {
  selectedFolders: Ref<Set<FolderPath>>
  addSelectedFolder: (path: FolderPath) => void
  removeSelectedFolder: (path: FolderPath) => void
}