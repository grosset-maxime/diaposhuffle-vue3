// Types
import type { Ref } from 'vue';

// Vendors Libs
import { ref } from 'vue';
import { createGlobalState } from '@vueuse/core';

import { getFolders as getFoldersAPI } from '@/api/folders';
import { buildError } from '@/api/api';

export interface Folder {
  path: string;
  name: string;
  isRoot: boolean;
  children: Array<Ref<Folder>>;
  fetched: boolean;
  fetching: boolean;
}

export const useFolderBrowserStore = createGlobalState(() => {
  const ROOT_PATH = '/';

  const findFolder = (
    folder: Ref<Folder>,
    pathParts: Array<string>,
    level: number = 0
  ): Ref<Folder> => {
    if (level >= pathParts.length) {
      return folder;
    }

    const child = folder.value.children.find((folder) => folder.value.name === pathParts[level]);

    if (child) {
      return findFolder(child, pathParts, level + 1);
    }

    return folder;
  };

  // State
  const rootFolder = ref<Folder>({
    path: ROOT_PATH,
    name: '',
    isRoot: true,
    children: [],
    fetched: false,
    fetching: false,
  });
  const folders = ref<Map<string, Ref<Folder>>>(new Map([[ROOT_PATH, rootFolder]]));

  const errors = ref<Array<{ [key: string]: unknown }>>([]);

  // Getters
  const getRootFolder = () => rootFolder;
  const getFolder = (path: string) => folders.value.get(path);

  // Mutations
  const _setFetching = ({
    folder,
    path = '',
    isFetching = false,
  }: {
    folder: Ref<Folder>;
    path?: string;
    isFetching?: boolean;
  }) => {
    if (!folder) {
      folder = findFolder(
        getRootFolder(),
        path.split('/').filter((s) => s)
      );
    }

    folder.value.fetching = isFetching;
  };

  const _setChildren = ({
    folder,
    path = '',
    children = [],
  }: {
    folder: Ref<Folder>;
    path?: string;
    children?: Array<any>;
  }) => {
    if (!folder) {
      folder = findFolder(
        getRootFolder(),
        path.split('/').filter((s) => s)
      );
    }

    folders.value.set(folder.value.path, folder);
    folder.value.fetched = true;
    folder.value.fetching = true;

    children.forEach((childName) => {
      const childPath = `${path}/${childName}`;
      const child: Ref<Folder> = ref<Folder>({
        path: childPath,
        name: childName,
        children: [],
        fetched: false,
        fetching: false,
        isRoot: false,
      });

      folders.value.set(childPath, child);

      folder.value.children.push(child);
    });
  };

  const addError = ({ actionName, error }: { actionName: string; error: unknown }) => {
    errors.value.push({
      [actionName]: error,
    });
    // eslint-disable-next-line no-console
    console.error(actionName, error);
  };

  // Actions
  async function fetchFolders(path?: string) {
    let children;
    // const folders = getters[FOLDER_BROWSER_G_FOLDERS];
    const folder = getFolder(path || ROOT_PATH);

    if (!folder) {
      throw buildError(`Folder not found with path:${path}`);
    }

    if (folder.value.fetched) {
      return folder.value.children;
    }

    _setFetching({ folder, path, isFetching: true });

    try {
      children = await getFoldersAPI({ path });
      _setChildren({ folder, path, children });
    } catch (e) {
      const error = buildError(e);
      addError({
        actionName: 'FOLDER_BROWSER_A_FETCH_FOLDERS',
        error,
      });
    }

    _setFetching({ folder, path, isFetching: false });

    return folder.value.children;
  }

  return {
    // Getters
    getRootFolder,
    getFolder,

    // Mutations
    addError,

    // Actions
    fetchFolders,
  };
});
