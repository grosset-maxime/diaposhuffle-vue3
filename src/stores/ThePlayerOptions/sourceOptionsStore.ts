// Types
import type { TagId } from '@/models/tag'
import type { FolderPath } from '@/stores/TheFolderBrowserStore'

import { createGlobalState, useStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

export enum TagsOperator {
  or = 'OR',
  and = 'AND',
}

export enum FileType {
  jpg = 'JPG',
  gif = 'GIF',
  png = 'PNG',
  webm = 'WEBM',
  mp4 = 'MP4',
  mkv = 'MKV',
}

interface states {
  folders: Array<FolderPath>;
  tags: Array<TagId>;
  tagsOperator: TagsOperator;
  fileTypes: Array<FileType>;
}

export const useSourceOptionsStore = createGlobalState(() => {
  const AVAILABLE_FILE_TYPES = [
    FileType.jpg,
    FileType.gif,
    FileType.png,
    FileType.webm,
    FileType.mp4,
    FileType.mkv,
  ]

  const defaultStates: states = {
    folders: [],
    tags: [],
    tagsOperator: TagsOperator.and,
    fileTypes: [],
  }

  // States
  const states = useStorage('ds3-playerOpts-sourceOpts', defaultStates, localStorage, {
    mergeDefaults: true,
  })
  const isFromPined = ref<boolean>(false)

  // #region Computeds
  // List of selected folder path.
  const folders = computed<Set<FolderPath>>({
    get: () => new Set(states.value.folders),
    set: (val: Set<FolderPath>) => (states.value.folders = Array.from(val.values())),
  })

  // List of selected tags ids.
  const tags = computed<Set<TagId>>({
    get: () => new Set(states.value.tags),
    set: (val: Set<TagId>) => (states.value.tags = Array.from(val.values())),
  })

  const tagsOperator = computed<TagsOperator>({
    get: () => states.value.tagsOperator,
    set: (val: TagsOperator) => (states.value.tagsOperator = val),
  })

  // List of file extensions to filter.
  const fileTypes = computed<Array<FileType>>({
    get: () => states.value.fileTypes,
    set: (val: Array<FileType>) => (states.value.fileTypes = val),
  })

  const availableFileTypes = computed<Array<FileType>>(() => [ ...AVAILABLE_FILE_TYPES ])
  // #endregion Computeds

  // #region Mutations
  const toggleTagsOperator = (val?: TagsOperator): void => {
    if (typeof val === 'string') {
      tagsOperator.value = val
    } else {
      tagsOperator.value = tagsOperator.value === TagsOperator.and
        ? TagsOperator.or
        : TagsOperator.and
    }
  }

  const setFileTypes = (vals: Array<FileType>): void => {
    fileTypes.value = [ ...vals ]
  }
  // #endregion Mutations

  return {
    // Computeds
    availableFileTypes,

    // Writable Computeds
    folders,
    tags,
    tagsOperator,
    fileTypes,
    isFromPined,

    // Mutations
    toggleTagsOperator,
    setFileTypes,
  }
})
