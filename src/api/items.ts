// Types
import type { Item, ItemExtension } from '@/models/item'
import type { TagId } from '@/models/tag'
import type { TagsOperator, FileType } from '@/stores/ThePlayerOptions/sourceOptions'

import { createItem } from '@/models/item'
import { BASE_URL, fetchJson } from '@/api/api'
import { createError } from '@/models/error'

/**
 * Fetch one random item from file system.
 * @param options - Options.
 * @param folders - Custom folders list.
 * @returns Promise with fetched item from FS.
 */
export const fetchRandomItem = async (
  { folders }: { folders?: Array<string> } = {},
): Promise<Item> => {
  let item: Item

  try {
    const url = `${BASE_URL}/api/getRandomPic`

    const opts = {
      method: 'POST',
      body: JSON.stringify({
        customFolders: folders,
      }),
    }

    const response: {
      success: boolean;
      pic: {
        src: string;
        randomPublicPath: string;
        customFolderPath: string;
        name: string; // with extension
        extension: ItemExtension; // without "."
        width?: number;
        height?: number;
        tags: Array<TagId>;
        useCache: boolean;
        warning: string;
      };
    } = await fetchJson(url, opts)
    item = createItem(response.pic)
  } catch (error) {
    throw createError(error, {
      file: 'items.ts',
    })
  }

  return item
}

/**
 * Fetch list of items matching options from the bdd.
 * @param options - Options.
 * @param options.tags - Tags ids.
 * @param options.types - Types filtering (JPG, GIF, PNG).
 * @param options.tagsOperator - Operator for tags filtering ('AND' or 'OR').
 * @returns Promise with Fetched items list from DB.
 */
export const fetchItemsFromBdd = async ({
  tags,
  tagsOperator,
  types,
}: {
  tags?: Array<TagId>
  types?: Array<FileType>
  tagsOperator?: TagsOperator
} = {}): Promise<Array<Item>> => {
  let items: Array<Item> = []

  try {
    const url = `${BASE_URL}/api/getPicsFromBdd`

    const opts = {
      method: 'POST',
      body: JSON.stringify({
        tags,
        tagsOperator,
        types,
      }),
    }

    const response: {
      success: boolean;
      results: Array<{
        extension: ItemExtension; // In UPPERCASE
        id: string; // Item db id.
        path: string; // ex: "/pic/test/aaa/bbb/i-B7D3LH9-L.jpg"
        tags: string; // ";tagId_1;tagId_2;" ex: ";ccc;aaaaaaaa;"
        type: string; // ex: "1" (TODO: seems not used yet)
      }>;
    } = await fetchJson(url, opts)

    items = response.results.map((item) =>
      createItem({
        src: item.path,
        tags: item.tags.split(';').filter((tag) => tag),
        extension: item.extension,
        // TODO: set type (file type) ?
      }),
    )
  } catch (error) {
    throw createError(error, {
      file: 'items.ts',
    })
  }

  return items
}

/**
 * Delete an item.
 * @param options - Options.
 * @param itemSrc - Item src.
 * @returns Promise with success
 */
export const deleteItem = async ({
  item,
}: {
  item: Item;
}): Promise<{ success: boolean }> => {
  if (!item || !item.src) {
    throw createError('Missing mandatory options.', {
      file: 'items.ts',
    })
  }

  let response: {
    success: boolean;
  }

  try {
    const url = `${BASE_URL}/api/deletePic`
    const opts = {
      method: 'POST',
      body: JSON.stringify({
        picPath: item.src,
      }),
    }

    response = await fetchJson(url, opts)
  } catch (error) {
    throw createError(error, {
      file: 'items.ts',
    })
  }

  return response
}

/**
 * Set tags to provided item.
 * @param options - Options.
 * @param options.item - Item.
 * @returns Promise with success
 */
export const setItemTags = async (
  { item }: { item: Item },
): Promise<{ success: boolean }> => {
  const { name, path, tags } = item

  if (!name || !path) {
    throw createError('Missing mandatory options.', {
      file: 'items.ts',
    })
  }

  let response: {
    success: boolean;
  }

  try {
    const url = `${BASE_URL}/api/setTags`
    const opts = {
      method: 'POST',
      body: JSON.stringify({ name, path, tags: Array.from(tags) }),
    }

    response = await fetchJson(url, opts)
  } catch (error) {
    throw createError(error, {
      file: 'items.ts',
    })
  }

  return response
}
