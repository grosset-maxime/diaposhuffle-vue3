// Types
import type { TagCategory, Tag, TagCategoryId, TagData, TagCategoryData } from '@/models/tag'

// Models
import {
  createTag,
  createTagCategory,
  Tag as TagClass,
  TagCategory as TagCategoryClass,
} from '@/models/tag'
import { BASE_URL, fetchJson } from '@/api/api'
import { logError } from '@/utils/errorUtils'
import { createCustomError } from '@/models/customError'

const FILE_NAME = 'api/tags.ts'

/**
 * Fetch the entire tags list.
 * @returns All tags list.
 */
export async function fetchTags (): Promise<Tag[]> {
  try {
    const url = `${BASE_URL}/api/getAllTags`

    const opts = {
      method: 'POST', // TODO: should be a GET ?
    }

    const json: {
      tags: Array<{
        id: string
        name: string
        category: string // CategoryId
      }>
    } = await fetchJson(url, opts)

    return (json.tags || [])
      .map((t) => createTag({
        id: t.id,
        name: t.name,
        categoryId: t.category,
      }))
  } catch (e) {
    throw logError(createCustomError(e, {
      file: FILE_NAME,
      actionName: 'fetchTags',
      isBackend: true,
    }))
  }
}

/**
 * Fetch list of categories (tags categories).
 * @returns Promise with
 */
export async function fetchCategories (): Promise<TagCategory[]> {
  try {
    const url = `${BASE_URL}/api/getAllTagCategories`

    const opts = {
      method: 'POST', // TODO: should be a GET ?
    }

    const json: {
      tagCategories: Array<{
        id: string
        name: string
        color: string // HEXA without the "#"
      }>
    } = await fetchJson(url, opts)

    return (json.tagCategories || [])
      .map((c) => createTagCategory({
        id: c.id,
        name: c.name,
        color: c.color,
      }))
  } catch (e) {
    throw logError(createCustomError(e, {
      file: FILE_NAME,
      actionName: 'fetchCategories',
      isBackend: true,
    }))
  }
}

/**
 * Edit a tag.
 * TODO: refactor by spliting to Add | Edit | Delete API.
 * @param options - Options.
 * @param options.isNew - Is a new tag.
 * @param options.isDelete - Should delete tag.
 * @param options.tag - Tag data or Tag.
 * @returns - Promise with Success or failure.
 */
async function editTag ({
  isNew,
  isDelete,
  tag,
}: {
  isNew?: boolean;
  isDelete?: boolean;
  tag: Tag | TagData;
}): Promise<boolean> {
  if (!tag) {
    throw logError(createCustomError('Missing tag option to edit tag.', {
      file: FILE_NAME,
      actionName: 'editTag',
      isBackend: false,
    }))
  }

  try {
    const url = `${BASE_URL}/api/editTag`

    const opts = {
      method: 'POST', // TODO: should be a PUT for update and DELETE for a delete ?
      body: JSON.stringify({
        isNew,
        isDelete,
        id: tag.id,
        name: tag.name,
        category: tag.categoryId,
      }),
    }

    const json = await fetchJson(url, opts)
    return !!json.success

  } catch (e) {
    throw logError(createCustomError(e, {
      file: FILE_NAME,
      actionName: 'editTag',
      isBackend: true,
    }))
  }
}

/**
 * Add a new tag.
 * @param tagData - Tag data.
 * @returns - Promise with new Tag.
 */
export async function addTag (tagData: TagData): Promise<Tag> {
  if (!tagData) {
    throw logError(createCustomError('Missing tagData option to add tag.', {
      file: FILE_NAME,
      actionName: 'addTag',
      isBackend: false,
    }))
  }

  let success = false

  try {
    success = await editTag({
      isNew: true,
      tag: tagData,
    })

    if (!success) {
      throw logError(createCustomError('Add tag not successful.', {
        file: FILE_NAME,
        actionName: 'addTag',
        isBackend: true,
      }))
    }
  } catch (e) {
    throw logError(createCustomError(e, {
      file: FILE_NAME,
      actionName: 'addTag',
      isBackend: true,
    }))
  }

  return createTag(tagData)
}

/**
 * Edit an existing tag.
 * @param tagData - Tag data or Tag.
 * @returns - Promise with updated Tag.
 */
export async function updateTag (tagData: TagData | Tag): Promise<Tag> {
  if (!tagData) {
    throw logError(createCustomError('Missing tag option to edit a tag.', {
      file: FILE_NAME,
      actionName: 'updateTag',
      isBackend: true,
    }))
  }

  try {
    const success = await editTag({ tag: tagData })

    if (!success) {
      throw logError(createCustomError('Update tag not successful.', {
        file: FILE_NAME,
        actionName: 'updateTag',
        isBackend: true,
      }))
    }
  } catch (e) {
    throw logError(createCustomError(e, {
      file: FILE_NAME,
      actionName: 'updateTag',
      isBackend: true,
    }))
  }

  return tagData instanceof TagClass
    ? tagData
    : createTag(tagData)
}

/**
 * Delete a tag.
 * @param tag - Tag data or Tag.
 * @returns - Promise with Success or failure.
 */
export async function deleteTag (tag: TagData | Tag): Promise<boolean> {
  if (!tag) {
    throw logError(createCustomError('Missing tag option to delete tag.', {
      file: FILE_NAME,
      actionName: 'deleteTag',
      isBackend: false,
    }))
  }

  let success = false

  try {
    success = await editTag({ tag, isDelete: true })
  } catch (e) {
    throw logError(createCustomError(e, {
      file: FILE_NAME,
      actionName: 'deleteTag',
      isBackend: true,
    }))
  }

  return success
}

/**
 * Edit a category.
 * TODO: refactor by spliting to Add | Edit | Delete API.
 * @param options - Options.
 * @param options.isNew - Is a new category.
 * @param options.isDelete - Should delete category.
 * @param options.category - Category data or Category.
 * @returns - Promise with Response object.
 */
async function editCategory ({
  isNew,
  isDelete,
  category,
}: {
  isNew?: boolean;
  isDelete?: boolean;
  category: TagCategory | TagCategoryData;
}): Promise<{
  success: boolean;
  tagCategoryId: TagCategoryId;
}> {
  try {
    const url = `${BASE_URL}/api/editTagCategory`

    const opts = {
      method: 'POST', // TODO: should be a PUT for update and DELETE for a delete ?
      body: JSON.stringify({
        isNew,
        isDelete,
        id: category.id,
        name: category.name,
        color: category.color,
      }),
    }

    return await fetchJson(url, opts)
  } catch (e) {
    throw logError(createCustomError(e, {
      file: FILE_NAME,
      actionName: 'editCategory',
      isBackend: true,
    }))
  }
}

/**
 * Add a new category.
 * @param categoryData - Category data.
 * @returns - Promise with new Category.
 */
export async function addCategory (
  categoryData: TagCategoryData,
): Promise<TagCategory> {
  try {
    if (!categoryData) {
      throw 'Missing categoryData option to add a new category.'
    }

    const response = await editCategory({
      isNew: true,
      category: categoryData,
    })
    categoryData.id = response.tagCategoryId

    if (!response.success) {
      throw 'Add category not successful.'
    }
  } catch (e) {
    throw logError(createCustomError(e, {
      file: FILE_NAME,
      actionName: 'addCategory',
      isBackend: true,
    }))
  }

  return createTagCategory(categoryData)
}

/**
 * Edit an existing category.
 * @param category - Category data or Category.
 * @returns - Promise with updated Category.
 */
export async function updateCategory (
  categoryData: TagCategoryData | TagCategory,
): Promise<TagCategory> {
  try {
    if (!categoryData) {
      throw 'Missing category option to edit a category.'
    }

    const response = await editCategory({ category: categoryData })
    const success = response.success

    if (!success) {
      throw 'Update category not successful.'
    }
  } catch (e) {
    throw logError(createCustomError(e, {
      file: FILE_NAME,
      actionName: 'updateCategory',
      isBackend: true,
    }))
  }

  return categoryData instanceof TagCategoryClass
    ? categoryData
    : createTagCategory(categoryData)
}

/**
 * Delete a category.
 * @param category - Category data or Category.
 * @returns - Promise with Success or failure.
 */
export async function deleteCategory (
  category: TagCategoryData | TagCategory,
): Promise<boolean> {
  try {
    if (!category) {
      throw 'Missing category option to delete category.'
    }

    const response = await editCategory({ category, isDelete: true })

    return  response.success
  } catch (e) {
    throw logError(createCustomError(e, {
      file: FILE_NAME,
      actionName: 'deleteCategory',
      isBackend: true,
    }))
  }
}
