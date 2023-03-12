// Types
import type { TagCategory, Tag, TagCategoryId } from '@/models/tag';

import { createTag, createTagCategory } from '@/models/tag';
import { BASE_URL, buildError, fetchJson } from '@/api/api';

/**
 * Fetch the entire tags list.
 * @returns All tags list.
 */
export const fetchTags = async () => {
  let tags = [] as Array<Tag>;

  try {
    const url = `${BASE_URL}/api/getAllTags`;

    const opts = {
      method: 'POST', // TODO: should be a GET ?
    };

    const json = await fetchJson(url, opts);
    tags = (json.tags || []).map((t: Tag) => createTag(t));
  } catch (error) {
    throw buildError(error);
  }

  return tags;
};

/**
 * Fetch list of categories (tags categories).
 */
export const fetchCategories = async () => {
  let categories = [] as Array<TagCategory>;

  try {
    const url = `${BASE_URL}/api/getAllTagCategories`;

    const opts = {
      method: 'POST', // TODO: should be a GET ?
    };

    const json = await fetchJson(url, opts);
    categories = (json.tagCategories || []).map((c: TagCategory) => createTagCategory(c));
  } catch (error) {
    throw buildError(error);
  }

  return categories;
};

/**
 * Edit a tag.
 * TODO: refactor by spliting to Add | Edit | Delete API.
 * @param options - Options.
 * @param options.isNew - Is a new tag.
 * @param options.isDelete - Should delete tag.
 * @param options.tag - Tag.
 * @returns - Promise with Success or failure.
 */
const editTag = async ({
  isNew,
  isDelete,
  tag,
}: {
  isNew?: boolean;
  isDelete?: boolean;
  tag: Tag;
}) => {
  if (!tag) {
    throw buildError('Missing tag option to edit tag.');
  }

  let success = false;

  try {
    const url = `${BASE_URL}/api/editTag`;

    const opts = {
      method: 'POST', // TODO: should be a PUT for update and DELETE for a delete ?
      body: JSON.stringify({
        isNew,
        isDelete,
        id: tag.id,
        name: tag.name,
        category: tag.categoryId,
      }),
    };

    const json = await fetchJson(url, opts);
    success = !!json.success;
  } catch (error) {
    throw buildError(error);
  }

  return success;
};

/**
 * Add a new tag.
 * @param options - Options.
 * @param options.tag - Tag.
 * @returns - Promise with Success or failure.
 */
export const addTag = async ({ tag }: { tag: Tag }) => {
  if (!tag) {
    throw buildError('Missing tag option to add tag.');
  }

  let success = false;

  try {
    success = await editTag({
      isNew: true,
      tag,
    });
  } catch (error) {
    throw buildError(error);
  }

  return success;
};

/**
 * Edit an existing tag.
 * @param options - Options.
 * @param options.tag - Tag.
 * @returns - Promise with Success or failure.
 */
export const updateTag = async ({ tag }: { tag: Tag }) => {
  if (!tag) {
    throw buildError('Missing tag option to edit a tag.');
  }

  let success = false;

  try {
    success = await editTag({ tag });
  } catch (error) {
    throw buildError(error);
  }

  return success;
};

/**
 * Delete a tag.
 * @param options - Options.
 * @param options.tag - Tag.
 * @returns - Promise with Success or failure.
 */
export const deleteTag = async ({ tag }: { tag: Tag }) => {
  if (!tag) {
    throw buildError('Missing tag option to delete tag.');
  }

  let success = false;

  try {
    success = await editTag({ tag, isDelete: true });
  } catch (error) {
    throw buildError(error);
  }

  return success;
};

/**
 * Edit a category.
 * TODO: refactor by spliting to Add | Edit | Delete API.
 * @param options - Options.
 * @param options.isNew - Is a new category.
 * @param options.isDelete - Should delete category.
 * @param options.category - Category.
 * @returns - Promise with Response object.
 */
const editCategory = async ({
  isNew,
  isDelete,
  category,
}: {
  isNew?: boolean;
  isDelete?: boolean;
  category: TagCategory;
}): Promise<{
  success: boolean;
  tagCategoryId: TagCategoryId;
}> => {
  let json;

  try {
    const url = `${BASE_URL}/api/editTagCategory`;

    const opts = {
      method: 'POST', // TODO: should be a PUT for update and DELETE for a delete ?
      body: JSON.stringify({
        isNew,
        isDelete,
        id: category.id,
        name: category.name,
        color: category.color,
      }),
    };

    json = await fetchJson(url, opts);
  } catch (error) {
    throw buildError(error);
  }

  return json;
};

/**
 * Add a new category.
 * @param options - Options.
 * @param options.category - Category.
 * @returns - Promise with Category id.
 */
export const addCategory = async ({ category }: { category: TagCategory }) => {
  if (!category) {
    throw buildError('Missing category option to add a new category.');
  }

  let categoryId = '';

  try {
    const response = await editCategory({
      isNew: true,
      category,
    });
    categoryId = response.tagCategoryId;
  } catch (error) {
    throw buildError(error);
  }

  return categoryId;
};

/**
 * Edit an existing category.
 * @param options - Options.
 * @param options.category - Category.
 * @returns - Promise with Success or failure.
 */
export const updateCategory = async ({ category }: { category: TagCategory }) => {
  if (!category) {
    throw buildError('Missing category option to edit a category.');
  }

  let success = false;

  try {
    const response = await editCategory({ category });
    success = response.success;
  } catch (error) {
    throw buildError(error);
  }

  return success;
};

/**
 * Delete a category.
 * @param options - Options.
 * @param options.category - Category.
 * @returns - Promise with Success or failure.
 */
export const deleteCategory = async ({ category }: { category: TagCategory }) => {
  if (!category) {
    throw buildError('Missing category option to delete category.');
  }

  let success = false;

  try {
    const response = await editCategory({ category, isDelete: true });
    success = response.success;
  } catch (error) {
    throw buildError(error);
  }

  return success;
};
