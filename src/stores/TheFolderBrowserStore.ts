// Types

// Vendors Libs
import { ref, reactive } from 'vue'
import { createGlobalState } from '@vueuse/core'

// APIs
import { getFolders as getFoldersAPI } from '@/api/folders'

// Logics
import useReactiveMap from '@/logic/useReactiveMap'
import { useAlertStore } from './alertStore'
import { createErrorAlert, type ErrorAlert, type ErrorAlertData } from '@/models/Alerts/errorAlert'
import type { AlertId } from '@/models/Alerts/abstractAlert'

// Stores

export type FolderPath = string
export interface Folder {
  path: FolderPath
  parentPath: FolderPath
  name: string
  isRoot: boolean
  children: Array<FolderPath>
  fetched: boolean
  fetching: boolean
}

export const useTheFolderBrowserStore = createGlobalState(() => {
  const ROOT_PATH = '/'

  const alertStore = useAlertStore()

  // State
  const rootFolder = reactive<Folder>({
    path: ROOT_PATH,
    parentPath: ROOT_PATH,
    name: '',
    isRoot: true,
    children: [],
    fetched: false,
    fetching: false,
  })
  const folders = useReactiveMap<FolderPath, Folder>([ [ ROOT_PATH, rootFolder ] ])

  const errors = ref<Array<AlertId>>([])

  // Getters
  const getRootFolder = (): Folder => rootFolder
  const getFolder = (path: FolderPath): Folder | undefined => folders.value.get(path)

  // Private Methods
  function onError (error: unknown, errorData: ErrorAlertData = {}): ErrorAlert {
    const errorAlert = createErrorAlert(error, {
      ...errorData,
      file: 'TheFolderBrowserStore.ts',
    })
    alertStore.add(errorAlert)

    errors.value.push(errorAlert.id)

    return errorAlert
  }

  // #region Actions
  async function fetchChildrenFolders (parentPath: FolderPath): Promise<Array<FolderPath>> {
    const folder = getFolder(parentPath)

    if (!folder) {
      throw onError(`Folder not found with path: ${parentPath}`, {
        actionName: 'fetchChildrenFolders',
      })
    }

    if (folder.fetched) {
      return folder.children
    }

    folder.fetching = true

    try {
      const children = await getFoldersAPI({ path: parentPath })

      const getChildPath = (parentPath: FolderPath, childName: string) => {
        const childPath = parentPath === ROOT_PATH
          ? ''
          : parentPath
        return `${childPath}/${childName}`
      }

      children.forEach((childName) => {
        const childPath = getChildPath(parentPath, childName)
        const childFolder = reactive<Folder>({
          path: childPath,
          parentPath,
          name: childName,
          children: [],
          fetched: false,
          fetching: false,
          isRoot: false,
        })

        folders.value.set(childPath, childFolder)

        folder.children.push(childPath)
      })
    } catch (e) {
      onError(e, {
        actionName: 'FOLDER_BROWSER_A_FETCH_FOLDERS',
      })
    }

    folder.fetching = false
    folder.fetched = true

    return folder.children
  }
  // #endregion Actions

  return {
    // Getters
    getRootFolder,
    getFolder,

    // Actions
    fetchChildrenFolders,
  }
})
