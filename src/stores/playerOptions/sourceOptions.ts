// Types
import type { TagId } from '@/models/tag'

import { createGlobalState, useStorage } from '@vueuse/core'
import { computed } from 'vue'

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
  folders: Array<string>;
  tags: Array<TagId>;
  tagsOperator: TagsOperator;
  fileTypes: Array<FileType>;
  isFromPined: boolean;
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

  // TODO: use set instead of array
  const defaultStates: states = {
    folders: [],
    tags: [],
    tagsOperator: TagsOperator.and,
    fileTypes: [],
    isFromPined: false,
  }

  // States
  const states = useStorage('ds3-playerOpts-sourceOpts', defaultStates, localStorage, {
    mergeDefaults: true,
  })

  //#region Computeds
  // List of selected folder path.
  const folders = computed({
    get: () => states.value.folders,
    set: (val) => (states.value.folders = val),
  })

  // List of selected tags ids.
  const tags = computed({
    get: () => states.value.tags,
    set: (val) => (states.value.tags = val),
  })

  const tagsOperator = computed({
    get: () => states.value.tagsOperator,
    set: (val) => (states.value.tagsOperator = val),
  })

  // List of file extensions to filter.
  const fileTypes = computed({
    get: () => states.value.fileTypes,
    set: (val) => (states.value.fileTypes = val),
  })

  // Should use pineds items as fetch items source.
  const isFromPined = computed({
    get: () => states.value.isFromPined,
    set: (val) => (states.value.isFromPined = !!val),
  })

  const availableFileTypes = computed(() => [ ...AVAILABLE_FILE_TYPES ])
  //#endregion Computeds

  //#region Mutations
  const toggleTagsOperator = (val?: TagsOperator) => {
    if (typeof val === 'string') {
      tagsOperator.value = val
    } else {
      tagsOperator.value = tagsOperator.value === TagsOperator.and
        ? TagsOperator.or
        : TagsOperator.and
    }
  }

  const setFileTypes = (vals: Array<FileType>) => {
    fileTypes.value = [ ...vals ]
  }
  //#endregion Mutations

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
