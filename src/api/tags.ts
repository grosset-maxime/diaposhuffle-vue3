// Types
import type { TagCategory, Tag, TagCategoryId, TagData, TagCategoryData } from '@/models/tag'

// Models
import {
  createTag,
  createTagCategory,
  Tag as TagClass,
  TagCategory as TagCategoryClass,
} from '@/models/tag'
import { BASE_URL, buildError, fetchJson } from '@/api/api'

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

    const json = await fetchJson(url, opts)
    tags = (json.tags || []).map((t: TagData) => createTag(t))
  } catch (error) {
    throw buildError(error)
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

    const json = await fetchJson(url, opts)
    categories = (json.tagCategories || []).map((c: TagCategory) => createTagCategory(c))
  } catch (error) {
    throw buildError(error)
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
    throw buildError('Missing tag option to edit tag.')
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
    throw buildError(error)
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
    throw buildError('Missing tagData option to add tag.')
  }

  let success = false

  try {
    success = await editTag({
      isNew: true,
      tag: tagData,
    })
    if (!success) { throw buildError('Add tag not successful.')}
  } catch (error) {
    throw buildError(error)
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
    throw buildError('Missing tag option to edit a tag.')
  }

  let success = false

  try {
    success = await editTag({ tag: tagData })
    if (!success) { throw buildError('Update tag not successful.')}
  } catch (error) {
    throw buildError(error)
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
    throw buildError('Missing tag option to delete tag.')
  }

  let success = false

  try {
    success = await editTag({ tag, isDelete: true })
  } catch (error) {
    throw buildError(error)
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
    throw buildError(error)
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
    throw buildError('Missing categoryData option to add a new category.')
  }

  try {
    const response = await editCategory({
      isNew: true,
      category: categoryData,
    })
    categoryData.id = response.tagCategoryId

    if (!response.success) { throw buildError('Add category not successful.')}
  } catch (error) {
    throw buildError(error)
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
    throw buildError('Missing category option to edit a category.')
  }

  let success = false

  try {
    const response = await editCategory({ category: categoryData })
    success = response.success
    if (!success) { throw buildError('Update category not successful.') }
  } catch (error) {
    throw buildError(error)
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
    throw buildError('Missing category option to delete category.')
  }

  let success = false

  try {
    const response = await editCategory({ category, isDelete: true })
    success = response.success
  } catch (error) {
    throw buildError(error)
  }

  return success
}
