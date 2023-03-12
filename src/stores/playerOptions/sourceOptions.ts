// Types
import type { TagId } from '@/models/tag';

// import { ref } from 'vue';
import { createGlobalState, useStorage } from '@vueuse/core';

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
  ];

  const defaultStates: states = {
    folders: [], // List of selected folder path.
    tags: [], // List of selected tags ids.
    tagsOperator: TagsOperator.and,
    fileTypes: [], // List of file extensions to filter.
    isFromPined: false, // Should use pineds items as fetch items source.
  };

  // State
  const states = useStorage('ds3-playerOpts-sourceOpts', defaultStates, localStorage, {
    mergeDefaults: true,
  });

  // Getters
  const getAvailableFileTypes = () => [...AVAILABLE_FILE_TYPES];
  const getFolders = () => states.value.folders;
  const getTags = () => states.value.tags;
  const hasTags = () => !!states.value.tags.length;
  const getTagsOperator = () => states.value.tagsOperator;
  const getFileTypes = () => states.value.fileTypes;
  const hasFileTypes = () => !!states.value.fileTypes.length;
  const isFromPined = () => states.value.isFromPined;

  // Mutations
  const setFolders = (folders: Array<string>) => (states.value.folders = folders);
  const setTags = (tags: Array<TagId>) => {
    states.value.tags = [...tags];
  };

  const toggleTagsOperator = (val?: TagsOperator) => {
    if (typeof val === 'string') {
      states.value.tagsOperator = val;
    } else {
      const currentVal = states.value.tagsOperator;
      // eslint-disable-next-line prettier/prettier
      states.value.tagsOperator = currentVal === TagsOperator.and
        ? TagsOperator.or
        : TagsOperator.and;
    }
  };

  const setFileTypes = (fileTypes: Array<FileType>) => {
    states.value.fileTypes = [...fileTypes];
  };

  const setIsFromPined = (val: boolean) => {
    states.value.isFromPined = val;
  };

  return {
    // Getters
    getAvailableFileTypes,
    getFolders,
    getTags,
    hasTags,
    getTagsOperator,
    getFileTypes,
    hasFileTypes,
    isFromPined,

    // Mutations
    setFolders,
    setTags,
    toggleTagsOperator,
    setFileTypes,
    setIsFromPined,
  };
});
