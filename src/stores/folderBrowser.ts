// Vendors Libs
import { ref, reactive } from 'vue'
import { createGlobalState } from '@vueuse/core'

import { getFolders as getFoldersAPI } from '@/api/folders'
import { buildError } from '@/api/api'

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

export const useFolderBrowserStore = createGlobalState(() => {
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
  const folders = reactive<Map<string, Folder>>(new Map([ [ ROOT_PATH, rootFolder ] ]))

  const errors = ref<Array<{ [key: string]: unknown }>>([])

  // Getters
  const getRootFolder = () => rootFolder
  const getFolder = (path: FolderPath) => folders.get(path)

  // Mutations
  const addError = ({ actionName, error }: { actionName: string; error: unknown }) => {
    errors.value.push({
      [ actionName ]: error,
    })
    console.error(actionName, error)
  }

  // Actions
  async function fetchChildrenFolders (parentPath: FolderPath) {
    const folder = getFolder(parentPath)

    if (!folder) {
      throw buildError(`Folder not found with path: ${parentPath}`)
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

        folders.set(childPath, childFolder)

        folder.children.push(childPath)
      })
    } catch (e) {
      const error = buildError(e)
      addError({
        actionName: 'FOLDER_BROWSER_A_FETCH_FOLDERS',
        error,
      })
    }

    folder.fetching = false
    folder.fetched = true

    return folder.children
  }

  return {
    // Getters
    getRootFolder,
    getFolder,

    // Mutations
    addError,

    // Actions
    fetchChildrenFolders,
  }
})
