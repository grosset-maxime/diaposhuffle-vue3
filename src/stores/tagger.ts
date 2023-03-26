// TODO: Enh: On delete a category, make a call to update all tags which was set
//            to that category to set it the none category.
// Types
import type {
  Tag,
  TagId,
  TagData,
  TagCategory,
  TagCategoryId,
  TagCategoryData,
} from '@/models/tag'

// Vendors Libs
import { computed, ref, reactive } from 'vue'
import { createGlobalState } from '@vueuse/core'

import { buildError } from '@/api/api'
import { createTagCategory } from '@/models/tag'
import {
  fetchTags as fetchTagsAPI,
  addTag as addTagAPI,
  updateTag as updateTagAPI,
  deleteTag as deleteTagAPI,
  fetchCategories as fetchCategoriesAPI,
  addCategory as addCategoryAPI,
  updateCategory as updateCategoryAPI,
  deleteCategory as deleteCategoryAPI,
} from '@/api/tags'

export const useTaggerStore = createGlobalState(() => {
  // State
  const taggerReady = ref(false)
  const tagsFetched = ref(false)
  const tags = ref<Map<TagId, Tag>>(new Map())

  const categoriesFetched = ref(false)
  const categories = ref<Map<TagCategoryId, TagCategory>>(new Map())

  const lastUsedTags = ref<Map<TagId, Tag>>(new Map())

  const errors = reactive<Array<{ [key: string]: unknown }>>([])

  // Computed
  const isTaggerReady = computed(() => taggerReady.value)
  const tagsList = computed(() => Array.from(tags.value.values()))
  const categoriesList = computed(() => Array.from(categories.value.values()))
  const lastUsedTagsList = computed(() => Array.from(lastUsedTags.value.values()))

  // Getters
  const getTag = (id: TagId) => tags.value.get(id)
  const getCategory = (id: TagCategoryId) => categories.value.get(id)
  const getErrors = () => errors

  //#region Mutations
  const addError = ({ actionName, error }: { actionName: string; error: unknown }) => {
    errors.push({
      [ actionName ]: error,
    })
    // eslint-disable-next-line no-console
    console.error(actionName, error)
  }

  const addLastUsedTag = (tagId: Tag | TagId) => {
    const tag = typeof tagId === 'string'
      ? getTag(tagId)
      : tagId

    if (!tag) { return }
    tag.lastUsed = Date.now()
    lastUsedTags.value.set(tag.id, tag)
  }

  const _setTagsFetched = (val: boolean) => (tagsFetched.value = val)
  const _setCategoriesFetched = (val: boolean) => (categoriesFetched.value = val)
  const _setTags = (fetchedTags: Array<Tag>) => {
    _updateTags(new Map(fetchedTags.map((tag) => [ tag.id, tag ])))
  }
  const _addTag = (tag: Tag) => {
    tag.update()
    tags.value = (new Map(tags.value)).set(tag.id, tag)
    _updateCategories()
  }
  const _updateTag = (tag: Tag) => {
    tag.update()
    tags.value = (new Map(tags.value)).set(tag.id, tag)
    _updateCategories()
  }
  const _deleteTag = (tag: Tag) => {
    const map = new Map(tags.value)
    map.delete(tag.id)
    tags.value = map

    _updateCategories()
  }
  const _setCategories = (cats: Array<TagCategory>) => {
    _updateCategories(new Map(cats.map((cat) => [ cat.id, cat ])))
  }
  const _addCategory = (cat: TagCategory) => {
    cat.update()
    const newMap = new Map(categories.value)
    newMap.set(cat.id, cat)
    categories.value = newMap
    _updateTags()
  }
  const _updateCategory = (cat: TagCategory) => {
    cat.update()
    categories.value = (new Map(categories.value)).set(cat.id, cat)
    _updateTags()
  }
  const _deleteCategory = (cat: TagCategory) => {
    const map = new Map(categories.value)
    map.delete(cat.id)
    categories.value = map

    _updateTags()
  }

  const _updateTags = (tagsMap?: Map<TagId, Tag>) => {
    tags.value.forEach((tag) => tag.update())
    tags.value = tagsMap || new Map(tags.value)
  }
  const _updateCategories = (categoriesMap?: Map<TagCategoryId, TagCategory>) => {
    categories.value.forEach((cat) => cat.update())
    categories.value = categoriesMap || new Map(categories.value)
  }
  //#endregion Mutations

  //#region Actions
  async function addTag (tagData: TagData) {
    try {
      const tag = await addTagAPI(tagData)

      if (!tag) {
        throw buildError('Fail to add a new tag.')
      }

      _addTag(tag)
    } catch (e) {
      const error = buildError(e)
      addError({
        actionName: 'TAGGER_A_ADD_TAG',
        error,
      })
    }
  }

  async function updateTag (tagData: TagData) {
    try {
      const tag = await updateTagAPI(tagData)

      if (!tag) {
        throw buildError('Fail to update tag.')
      }

      _updateTag(tag)
    } catch (e) {
      const error = buildError(e)
      addError({
        actionName: 'TAGGER_A_UPDATE_TAG',
        error,
      })
    }
  }

  async function deleteTag (tagId: Tag | TagId) {
    const tag = typeof tagId === 'string'
      ? getTag(tagId)
      : tagId

    if (!tag) {
      throw buildError(`Tag not found: ${tagId}`)
    }

    try {
      const success = await deleteTagAPI(tag)

      if (!success) {
        throw buildError('Fail to delete tag.')
      }

      _deleteTag(tag)
    } catch (e) {
      const error = buildError(e)
      addError({
        actionName: 'TAGGER_A_DELETE_TAG',
        error,
      })
    }
  }

  async function addCategory (categoryData: TagCategoryData) {
    try {
      const category = await addCategoryAPI(categoryData)

      if (!category) {
        throw buildError('Fail to add a new category.')
      }

      _addCategory(category)
    } catch (e) {
      const error = buildError(e)
      addError({
        actionName: 'TAGGER_A_ADD_CATEGORY',
        error,
      })
    }
  }

  async function updateCategory (categoryData: TagCategoryData) {
    try {
      const category = await updateCategoryAPI(categoryData)

      if (!category) {
        throw buildError('Fail to update category.')
      }

      _updateCategory(category)
    } catch (e) {
      const error = buildError(e)
      addError({
        actionName: 'TAGGER_A_UPDATE_CATEGORY',
        error,
      })
    }
  }

  async function deleteCategory (categoryId: TagCategory | TagCategoryId) {
    const category = typeof categoryId === 'string'
      ? getCategory(categoryId)
      : categoryId

    if (!category) {
      throw buildError(`Tag not found: ${categoryId}`)
    }

    try {
      const success = await deleteCategoryAPI(category)

      if (!success) {
        throw buildError('Fail to delete category.')
      }

      _deleteCategory(category)
    } catch (e) {
      const error = buildError(e)
      addError({
        actionName: 'TAGGER_A_DELETE_CATEGORY',
        error,
      })
    }
  }

  async function _fetchTags (): Promise<Map<TagId, Tag>> {
    if (tagsFetched.value) {
      return tags.value
    }

    try {
      const tags = await fetchTagsAPI()
      _setTags(tags)
    } catch (e) {
      const error = buildError(e)
      addError({
        actionName: 'TAGGER_A_FETCH_TAGS',
        error,
      })
    }

    _setTagsFetched(true)

    return tags.value
  }

  async function _fetchCategories (): Promise<Map<TagCategoryId, TagCategory>> {
    if (categoriesFetched.value) {
      return categories.value
    }

    try {
      const categories = await fetchCategoriesAPI()

      categories.push(createTagCategory({
        id: '0',
        name: 'None',
        color: 'FFFFFF',
      }))

      _setCategories(categories)
    } catch (e) {
      const error = buildError(e)
      addError({
        actionName: 'TAGGER_A_FETCH_TAGS',
        error,
      })
    }

    _setCategoriesFetched(true)

    return categories.value
  }
  //#endregion Actions

  // TODO: ENH: show error alert if fail to fetch tags or categories.
  const taggerReadyPromise = Promise.all([
    _fetchTags(),
    _fetchCategories(),
  ]).then(() => {
    _updateTags()
    _updateCategories()

    taggerReady.value = true
  })

  return {
    taggerReadyPromise,
    tags,
    categories,
    lastUsedTags,

    // Computeds
    isTaggerReady,
    tagsList,
    categoriesList,
    lastUsedTagsList,

    // Getters
    getTag,
    getCategory,
    getErrors,

    // Mutations
    addError,
    addLastUsedTag,

    // Actions
    addTag,
    updateTag,
    deleteTag,
    addCategory,
    updateCategory,
    deleteCategory,
  }
})
