// Types

// Vendors Libs
import { reactive } from 'vue'
import { createGlobalState } from '@vueuse/core'

// APIs
import { getFolders as getFoldersAPI } from '@/api/folders'

// Logics
import useReactiveMap from '@/logic/useReactiveMap'
import { createCustomError, type CustomError, type CustomErrorData } from '@/models/customError'
import { logError } from '@/utils/errorUtils'

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

  // Getters
  const getRootFolder = (): Folder => rootFolder
  const getFolder = (path: FolderPath): Folder | undefined => folders.value.get(path)

  // Private Methods
  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    const customError = createCustomError(error, {
      ...errorData,
      file: 'stores/TheFolderBrowserStore.ts',
    })
    logError(customError)

    return customError
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
      throw onError(e, { actionName: 'fetchChildrenFolders' })
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
