// TODO: Feature: Add fetch items from bdd with tags and types. DONE ?
// TODO: Bug: Backend: getimagesize raize warning in call response body that trigger json.parse to fail. Should be added to the response object as error.

// Types
import type { Item } from '@/models/item';

// Vendors Libs
import { ref } from 'vue';
import { createGlobalState } from '@vueuse/core';

import { getRandomElementWithIndex } from '@/utils/utils';
import { buildError } from '@/api/api';
import {
  fetchRandomItem as fetchRandomItemAPI,
  fetchItemsFromBdd as fetchItemsFromBddAPI,
  deleteItem as deleteItemAPI,
  setItemTags as setItemTagsAPI,
} from '@/api/items';
import { Item as ItemClass } from '@/models/item';

// Stores
import { usePlayerOptionsStore } from '@/stores/playerOptions/playerOptions';
import { useSourceOptionsStore } from '@/stores/playerOptions/sourceOptions';

export enum FetchSource {
  fs = 'random', // Fetch from fs.
  db = 'items', // Fetch from Items list returned by data base.
  pineds = 'pineds', // Fetch from pined items list.
  history = 'history', // Last shown items.
}

export const usePlayerStore = createGlobalState(() => {
  const playerOptsStore = usePlayerOptionsStore();
  const sourceOptsStore = useSourceOptionsStore();

  // State
  const items = ref<Array<Item>>([]);
  const itemIndex = ref(-1);

  const historyItems = ref<Array<Item>>([]);
  const historyItemIndex = ref(0);

  const pinedItems = ref<Array<Item>>([]);
  const pinedItemIndex = ref(-1);

  const fetchSource = ref<FetchSource>(FetchSource.fs);

  const errors = ref<Array<{ [key: string]: unknown }>>([]);

  // Getters
  const getItems = () => items.value;
  const getItemIndex = () => itemIndex.value;
  const getItemsLength = () => items.value.length;
  const getItemAt = (index: number) => items.value[index];

  const getHistoryItems = () => historyItems.value;
  const getHistoryLength = () => historyItems.value.length;
  const getHistoryItemAt = (index: number) => historyItems.value[index];
  const getHistoryIndex = () => historyItemIndex.value;

  const getPinedItems = () => pinedItems.value;
  const getPinedLength = () => pinedItems.value.length;
  const getPinedItemAt = (index: number) => pinedItems.value[index];
  const getPinedIndex = () => pinedItemIndex.value;
  const getPinedItemIndex = (itemSrc: string | Item) => {
    const src = itemSrc instanceof ItemClass ? itemSrc.src : itemSrc;
    return pinedItems.value.findIndex((item: Item) => item.src === src);
  };

  const getFetchSource = () => fetchSource.value;
  const getErrors = () => errors.value;

  const getPlayingItems = () => {
    const fetchSource = getFetchSource();
    let items: Array<Item> = [];

    if (fetchSource === FetchSource.pineds) {
      items = getPinedItems();
    } else if (fetchSource === FetchSource.db || fetchSource === FetchSource.fs) {
      items = getItems();
    } else if (fetchSource === FetchSource.history) {
      items = getHistoryItems();
    }

    return items;
  };

  const getPlayingIndex = () => {
    const fetchSource = getFetchSource();
    let index: number = -1;

    if (fetchSource === FetchSource.pineds) {
      index = getPinedIndex();
    } else if (fetchSource === FetchSource.db || fetchSource === FetchSource.fs) {
      index = getItemIndex();
    } else if (fetchSource === FetchSource.history) {
      index = getHistoryIndex();
    }

    return index;
  };

  const getPlayingItemsLength = () => {
    return getPlayingItems().length;
  };

  // Mutations
  const setItems = (itemsToSet: Array<Item>) => {
    items.value = itemsToSet;
    itemIndex.value = -1;
  };
  const clearItems = () => {
    items.value = [];
    itemIndex.value = -1;
  };
  const setItemIndex = (val: number) => (itemIndex.value = val);
  const setCurrentItemIndex = (val: number) => (itemIndex.value = val);
  const setCurrentPinedIndex = (val: number) => (pinedItemIndex.value = val);

  const setHistoryIndex = (val: number) => (historyItemIndex.value = val);
  const addHistoryItem = (item: Item) => historyItems.value.push(item);
  const setHistoryItemIndex = (index: number, item: Item) => (historyItems.value[index] = item);
  const deleteHistoryItem = (itemSrc: string | Item) => {
    const src = itemSrc instanceof ItemClass ? itemSrc.src : itemSrc;
    historyItemIndex.value -= 1;
    historyItems.value = historyItems.value.filter((i: Item) => i.src !== src);
  };

  const addPinedItem = (item: Item) => pinedItems.value.push(item);
  const splicePinedItem = (index: number) => pinedItems.value.splice(index, 1);
  const clearPineds = () => {
    pinedItems.value = [];
    pinedItemIndex.value = -1;
  };

  const setFetchSource = (val: FetchSource) => (fetchSource.value = val);
  const addError = ({ actionName, error }: { actionName: string; error: unknown }) => {
    errors.value.push({
      [actionName]: error,
    });
    // eslint-disable-next-line no-console
    console.error(actionName, error);
  };

  // Actions
  async function fetchNextItem(): Promise<Item> {
    let item: Item | undefined;
    const fetchSource = getFetchSource();

    const onError = (e: unknown) => {
      const error = buildError(e);
      addError({
        actionName: 'PLAYER_A_FETCH_NEXT',
        error,
      });
      return error;
    };

    try {
      if (fetchSource === FetchSource.db || fetchSource === FetchSource.pineds) {
        let index: number;
        let items: Array<Item> = [];
        let itemIndex: number = -1;

        if (fetchSource === FetchSource.db) {
          items = getItems();
          itemIndex = getItemIndex();
        } else if (fetchSource === FetchSource.pineds) {
          items = getPinedItems();
          itemIndex = getPinedIndex();
        }

        if (!items.length) {
          throw onError('Items are empty.');
        }

        if (playerOptsStore.isFetchItemRandomly()) {
          const obj = getRandomElementWithIndex(items);
          item = obj.el;
          index = obj.index;
        } else {
          index = itemIndex + 1;
          if (index >= items.length) {
            index = 0;
          }
          item = items[index];
        }
      } else if (fetchSource === FetchSource.fs) {
        item = await fetchRandomItemAPI({
          folders: sourceOptsStore.getFolders(),
        });
      } else {
        throw onError(`Invalid state.fetchNextFrom:"${fetchSource}"`);
      }
    } catch (e) {
      throw onError(e);
    }

    if (!item) {
      throw onError('No item found.');
    }

    return item;
  }

  async function fetchPreviousItem() {
    let item: Item;
    const fetchSource = getFetchSource();

    const onError = (e: unknown) => {
      const error = buildError(e);
      addError({
        actionName: 'PLAYER_A_FETCH_PREV',
        error,
      });
      return error;
    };

    try {
      if (
        (fetchSource === FetchSource.db || fetchSource === FetchSource.pineds) &&
        !playerOptsStore.isFetchItemRandomly()
      ) {
        let index: number;
        let items: Array<Item> = [];
        let itemIndex: number = -1;

        if (fetchSource === FetchSource.db) {
          items = getItems();
          itemIndex = getItemIndex();
        } else if (fetchSource === FetchSource.pineds) {
          items = getPinedItems();
          itemIndex = getPinedIndex();
        }

        if (items.length) {
          throw onError('Items are empty.');
        }

        index = itemIndex - 1;
        if (index < 0) {
          index = items.length - 1;
        }

        item = items[index];
      } else {
        item = await fetchNextItem();
      }
    } catch (e) {
      throw onError(e);
    }

    if (!item) {
      throw onError('No item found.');
    }

    return item;
  }

  function fetchItemsFromFS() {
    clearItems();
    setFetchSource(FetchSource.fs);
    return Promise.resolve();
  }

  async function fetchItemsFromDB() {
    let items: Array<Item>;

    const tags = sourceOptsStore.getTags();
    const tagsOperator = sourceOptsStore.getTagsOperator();
    const fileTypes = sourceOptsStore.getFileTypes();

    try {
      items = await fetchItemsFromBddAPI({
        tags,
        tagsOperator,
        types: fileTypes,
      });

      setItems(items);
      setFetchSource(FetchSource.db);
    } catch (e) {
      const error = buildError(e);
      addError({
        actionName: 'PLAYER_A_FETCH_ITEMS_FROM_BDD',
        error,
      });
      throw error;
    }

    return items;
  }

  function fetchItemsFromPineds() {
    setFetchSource(FetchSource.pineds);
    setCurrentPinedIndex(-1);
    return Promise.resolve();
  }

  async function deleteItem({
    item,
    fromBddOnly,
    ignoreIfNotExist,
  }: {
    item: Item;
    fromBddOnly?: boolean;
    ignoreIfNotExist?: boolean;
  }) {
    let result = false;

    try {
      const response = await deleteItemAPI({ item, fromBddOnly, ignoreIfNotExist });
      result = response.success;
    } catch (e) {
      const error = buildError(e);
      addError({
        actionName: 'PLAYER_A_DELETE_ITEM',
        error,
      });
      throw error;
    }

    return result;
  }

  async function setItemTags({ item }: { item: Item }) {
    let result = false;

    try {
      const response = await setItemTagsAPI({ item });
      result = response.success;
    } catch (e) {
      const error = buildError(e);
      addError({
        actionName: 'PLAYER_A_SET_ITEM_TAGS',
        error,
      });

      throw error;
    }

    return result;
  }

  return {
    // Getters
    getItems,
    getItemIndex,
    getItemsLength,
    getItemAt,

    getHistoryItems,
    getHistoryLength,
    getHistoryItemAt,
    getHistoryIndex,

    getPinedItems,
    getPinedLength,
    getPinedItemAt,
    getPinedIndex,
    getPinedItemIndex,

    getFetchSource,
    getErrors,

    getPlayingItems,
    getPlayingIndex,
    getPlayingItemsLength,

    // Mutations
    setItems,
    clearItems,
    setItemIndex,
    setCurrentItemIndex,
    setCurrentPinedIndex,
    setHistoryIndex,
    addHistoryItem,
    setHistoryItemIndex,
    deleteHistoryItem,
    addPinedItem,
    splicePinedItem,
    clearPineds,
    setFetchSource,
    addError,

    // Actions
    fetchNextItem,
    fetchPreviousItem,
    fetchItemsFromFS,
    fetchItemsFromDB,
    fetchItemsFromPineds,
    deleteItem,
    setItemTags,
  };
});
