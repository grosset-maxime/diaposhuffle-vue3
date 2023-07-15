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
import { createErrorAlert } from '@/models/Alerts/errorAlert'

/**
 * Fetch the entire tags list.
 * @returns All tags list.
 */
export const fetchTags = async () => {
  let tags = [] as Array<Tag>

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

    tags = (json.tags || [])
      .map((t) => createTag({
        id: t.id,
        name: t.name,
        categoryId: t.category,
      }))
  } catch (error) {
    throw createErrorAlert(error, {
      file: 'tags.ts',
    })
  }

  return tags
}

/**
 * Fetch list of categories (tags categories).
 * @returns Promise with
 */
export const fetchCategories = async () => {
  let categories = [] as Array<TagCategory>

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

    categories = (json.tagCategories || [])
      .map((c) => createTagCategory({
        id: c.id,
        name: c.name,
        color: c.color,
      }))
  } catch (error) {
    throw createErrorAlert(error, {
      file: 'tags.ts',
    })
  }

  return categories
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
const editTag = async ({
  isNew,
  isDelete,
  tag,
}: {
  isNew?: boolean;
  isDelete?: boolean;
  tag: Tag | TagData;
}) => {
  if (!tag) {
    throw createErrorAlert('Missing tag option to edit tag.', {
      file: 'tags.ts',
    })
  }

  let success = false

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
    success = !!json.success
  } catch (error) {
    throw createErrorAlert(error, {
      file: 'tags.ts',
    })
  }

  return success
}

/**
 * Add a new tag.
 * @param tagData - Tag data.
 * @returns - Promise with new Tag.
 */
export const addTag = async (tagData: TagData) => {
  if (!tagData) {
    throw createErrorAlert('Missing tagData option to add tag.', {
      file: 'tags.ts',
    })
  }

  let success = false

  try {
    success = await editTag({
      isNew: true,
      tag: tagData,
    })
    if (!success) {
      throw createErrorAlert('Add tag not successful.', {
        file: 'tags.ts',
      })
    }
  } catch (error) {
    throw createErrorAlert(error, {
      file: 'tags.ts',
    })
  }

  return createTag(tagData)
}

/**
 * Edit an existing tag.
 * @param tagData - Tag data or Tag.
 * @returns - Promise with updated Tag.
 */
export const updateTag = async (tagData: TagData | Tag) => {
  if (!tagData) {
    throw createErrorAlert('Missing tag option to edit a tag.', {
      file: 'tags.ts',
    })
  }

  let success = false

  try {
    success = await editTag({ tag: tagData })
    if (!success) {
      throw createErrorAlert('Update tag not successful.', {
        file: 'tags.ts',
      })
    }
  } catch (error) {
    throw createErrorAlert(error, {
      file: 'tags.ts',
    })
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
export const deleteTag = async (tag: TagData | Tag) => {
  if (!tag) {
    throw createErrorAlert('Missing tag option to delete tag.', {
      file: 'tags.ts',
    })
  }

  let success = false

  try {
    success = await editTag({ tag, isDelete: true })
  } catch (error) {
    throw createErrorAlert(error, {
      file: 'tags.ts',
    })
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
const editCategory = async ({
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
}> => {
  let json

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

    json = await fetchJson(url, opts)
  } catch (error) {
    throw createErrorAlert(error, {
      file: 'tags.ts',
    })
  }

  return json
}

/**
 * Add a new category.
 * @param categoryData - Category data.
 * @returns - Promise with new Category.
 */
export const addCategory = async (categoryData: TagCategoryData) => {
  if (!categoryData) {
    throw createErrorAlert('Missing categoryData option to add a new category.', {
      file: 'tags.ts',
    })
  }

  try {
    const response = await editCategory({
      isNew: true,
      category: categoryData,
    })
    categoryData.id = response.tagCategoryId

    if (!response.success) {
      throw createErrorAlert('Add category not successful.', {
        file: 'tags.ts',
      })
    }
  } catch (error) {
    throw createErrorAlert(error, {
      file: 'tags.ts',
    })
  }

  return createTagCategory(categoryData)
}

/**
 * Edit an existing category.
 * @param category - Category data or Category.
 * @returns - Promise with updated Category.
 */
export const updateCategory = async (categoryData: TagCategoryData | TagCategory) => {
  if (!categoryData) {
    throw createErrorAlert('Missing category option to edit a category.', {
      file: 'tags.ts',
    })
  }

  let success = false

  try {
    const response = await editCategory({ category: categoryData })
    success = response.success
    if (!success) {
      throw createErrorAlert('Update category not successful.', {
        file: 'tags.ts',
      })
    }
  } catch (error) {
    throw createErrorAlert(error, {
      file: 'tags.ts',
    })
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
export const deleteCategory = async (category: TagCategoryData | TagCategory) => {
  if (!category) {
    throw createErrorAlert('Missing category option to delete category.', {
      file: 'tags.ts',
    })
  }

  let success = false

  try {
    const response = await editCategory({ category, isDelete: true })
    success = response.success
  } catch (error) {
    throw createErrorAlert(error, {
      file: 'tags.ts',
    })
  }

  return success
}
