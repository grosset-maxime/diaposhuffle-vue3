import type { ComputedRef } from 'vue'
import type { FolderPath } from '@/stores/TheFolderBrowserStore'
import type { ReactiveSet } from '@/logic/useReactiveSet'

export interface TheFolderBrowser {
  selectedFolders: ComputedRef<ReactiveSet<FolderPath>>
  addSelectedFolder: (path: FolderPath) => void
  removeSelectedFolder: (path: FolderPath) => void
}