// Types
import type { Tag, TagId, TagCategory, TagCategoryId } from '@/models/tag';

// Vendors Libs
import { ref } from 'vue';
import { createGlobalState } from '@vueuse/core';

import { buildError } from '@/api/api';
import {
  fetchTags as fetchTagsAPI,
  addTag as addTagAPI,
  updateTag as updateTagAPI,
  deleteTag as deleteTagAPI,
  fetchCategories as fetchCategoriesAPI,
  addCategory as addCategoryAPI,
  updateCategory as updateCategoryAPI,
  deleteCategory as deleteCategoryAPI,
} from '@/api/tags';

export const useTaggerStore = createGlobalState(() => {
  const MAX_LENGTH_LAST_USED_TAG_IDS = 10;

  // State
  const tagsFetched = ref(false);
  const tags = ref<Map<TagId, Tag>>(new Map());

  const categoriesFetched = ref(false);
  const categories = ref<Map<TagCategoryId, TagCategory>>(new Map());

  const lastUsedTagIds = ref<Array<TagId>>([]);

  const errors = ref<Array<{ [key: string]: unknown }>>([]);

  // Getters
  const getTags = () => tags.value;
  const getTag = (id: TagId) => tags.value.get(id);
  const getTagsList = () => Array.from(tags.value.values());
  const getLastUsedTagIds = () => lastUsedTagIds.value;
  const getCategories = () => categories.value;
  const getCategoriesList = () => Array.from(categories.value.values());
  const getCategory = (id: TagCategoryId) => categories.value.get(id);
  const getCategoryColor = (id: TagCategoryId) => categories.value.get(id)?.color;

  const getErrors = () => errors.value;

  // Mutations
  const addError = ({ actionName, error }: { actionName: string; error: unknown }) => {
    errors.value.push({
      [actionName]: error,
    });
    // eslint-disable-next-line no-console
    console.error(actionName, error);
  };

  const addLastUsedTagId = (id: TagId) => {
    const ids = lastUsedTagIds.value.filter((tagId) => tagId !== id);
    ids.unshift(id);
    lastUsedTagIds.value = ids.slice(0, MAX_LENGTH_LAST_USED_TAG_IDS);
  };

  const _setTagsFetched = (val: boolean) => (tagsFetched.value = val);
  const _setCategoriesFetched = (val: boolean) => (categoriesFetched.value = val);
  const _setTags = (fetchedTags: Array<Tag>) =>
    (tags.value = new Map(fetchedTags.map((t) => [t.id, t])));
  const _addTag = (tag: Tag) => tags.value.set(tag.id, tag);
  const _updateTag = (tag: Tag) => tags.value.set(tag.id, tag);
  const _deleteTag = (tag: Tag) => tags.value.delete(tag.id);
  const _setCategories = (cats: Array<TagCategory>) =>
    (categories.value = new Map(cats.map((c) => [c.id, c])));
  const _addCategory = (cat: TagCategory) => categories.value.set(cat.id, cat);
  const _updateCategory = (cat: TagCategory) => categories.value.set(cat.id, cat);
  const _deleteCategory = (cat: TagCategory) => categories.value.delete(cat.id);

  // Actions
  async function fetchTags() {
    if (tagsFetched.value) {
      return getTags();
    }

    try {
      const tags = await fetchTagsAPI();
      _setTags(tags);
    } catch (e) {
      const error = buildError(e);
      addError({
        actionName: 'TAGGER_A_FETCH_TAGS',
        error,
      });
    }

    _setTagsFetched(true);

    return getTags();
  }

  async function addTag(tag: Tag) {
    try {
      const success = await addTagAPI({ tag });

      if (!success) {
        throw buildError('Fail to add a new tag.');
      }

      _addTag(tag);
    } catch (e) {
      const error = buildError(e);
      addError({
        actionName: 'TAGGER_A_ADD_TAG',
        error,
      });
    }
  }

  async function updateTag(tag: Tag) {
    try {
      const success = await updateTagAPI({ tag });

      if (!success) {
        throw buildError('Fail to update tag.');
      }

      _updateTag(tag);
    } catch (e) {
      const error = buildError(e);
      addError({
        actionName: 'TAGGER_A_UPDATE_TAG',
        error,
      });
    }
  }

  async function deleteTag(tagId: Tag | TagId) {
    const tag = typeof tagId === 'string' ? getTag(tagId) : tagId;

    if (!tag) {
      throw buildError(`Tag not found: ${tagId}`);
    }

    try {
      const success = await deleteTagAPI({ tag });

      if (!success) {
        throw buildError('Fail to delete tag.');
      }

      _deleteTag(tag);
    } catch (e) {
      const error = buildError(e);
      addError({
        actionName: 'TAGGER_A_DELETE_TAG',
        error,
      });
    }
  }

  async function fetchCategories() {
    if (categoriesFetched.value) {
      return getCategories();
    }

    try {
      const categories = await fetchCategoriesAPI();
      _setCategories(categories);
    } catch (e) {
      const error = buildError(e);
      addError({
        actionName: 'TAGGER_A_FETCH_TAGS',
        error,
      });
    }

    _setCategoriesFetched(true);

    return getCategories();
  }

  async function addCategory(category: TagCategory) {
    try {
      const categoryId = await addCategoryAPI({ category });

      if (!categoryId) {
        throw buildError('Fail to add a new category.');
      }

      category.setId(categoryId);
      _addCategory(category);
    } catch (e) {
      const error = buildError(e);
      addError({
        actionName: 'TAGGER_A_ADD_CATEGORY',
        error,
      });
    }
  }

  async function updateCategory(category: TagCategory) {
    try {
      const success = await updateCategoryAPI({ category });

      if (!success) {
        throw buildError('Fail to update category.');
      }

      _updateCategory(category);
    } catch (e) {
      const error = buildError(e);
      addError({
        actionName: 'TAGGER_A_UPDATE_CATEGORY',
        error,
      });
    }
  }

  async function deleteCategory(categoryId: TagCategory | TagCategoryId) {
    const category = typeof categoryId === 'string' ? getCategory(categoryId) : categoryId;

    if (!category) {
      throw buildError(`Tag not found: ${categoryId}`);
    }

    try {
      const success = await deleteCategoryAPI({ category });

      if (!success) {
        throw buildError('Fail to delete category.');
      }

      _deleteCategory(category);
    } catch (e) {
      const error = buildError(e);
      addError({
        actionName: 'TAGGER_A_DELETE_CATEGORY',
        error,
      });
    }
  }

  return {
    // Getters
    getTags,
    getTag,
    getTagsList,
    getLastUsedTagIds,
    getCategories,
    getCategoriesList,
    getCategory,
    getCategoryColor,
    getErrors,

    // Mutations
    addError,
    addLastUsedTagId,

    // Actions
    fetchTags,
    addTag,
    updateTag,
    deleteTag,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
});
