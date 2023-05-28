// Types
import type {
  Tag,
  TagId,
  TagData,
  TagCategory,
  TagCategoryId,
  TagCategoryData,
} from '@/models/tag'
import type { CustomError, CustomErrorData, CustomErrorId } from '@/models/error'

// Vendors Libs
import { computed, ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

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
import useReactiveMap from '@/logic/useReactiveMap'

import { useErrorStore } from '@/stores/errorStore'

export const useTheTaggerStore = createGlobalState(() => {
  const errorStore = useErrorStore()

  // State
  const taggerReadyPromise = ref<Promise<void> | undefined>()
  const taggerReady = ref(false)
  const tagsFetched = ref(false)
  const tags = useReactiveMap<TagId, Tag>()

  const categoriesFetched = ref(false)
  const categories = useReactiveMap<TagCategoryId, TagCategory>()

  const lastUsedTags = useReactiveMap<TagId, Tag>()

  const errors = ref<Array<CustomErrorId>>([])

  // Computed
  const isTaggerReady = computed<boolean>(() => taggerReady.value)
  const tagsList = computed<Array<Tag>>(() => Array.from(tags.value.values()))
  const categoriesList = computed<Array<TagCategory>>(() => Array.from(categories.value.values()))
  const lastUsedTagsList = computed<Array<Tag>>(() => Array.from(lastUsedTags.value.values()))

  // Getters
  const getTag = (id: TagId): Tag | undefined => tags.value.get(id)
  const getCategory = (id: TagCategoryId): TagCategory | undefined => categories.value.get(id)
  const getErrors = (): Array<CustomErrorId> => errors.value

  // #region Mutations
  function onError (error: unknown, errorData: CustomErrorData = {}): CustomError {
    const customError = errorStore.add(error, {
      ...errorData,
      file: 'TheTaggerStore.ts',
    })

    errors.value.push(customError.id)

    return customError
  }

  const addLastUsedTag = (tagId: Tag | TagId): void => {
    const tag = typeof tagId === 'string'
      ? getTag(tagId)
      : tagId

    if (!tag) { return }
    tag.lastUsed = Date.now()
    lastUsedTags.value.set(tag.id, tag)
  }

  const _setTagsFetched = (val: boolean): void => { tagsFetched.value = val }
  const _setCategoriesFetched = (val: boolean): void => { categoriesFetched.value = val }
  const _setTags = (fetchedTags: Array<Tag>): void => {
    tags.value.setValues(fetchedTags.map((tag) => [ tag.id, tag ]))
  }
  const _addTag = (tag: Tag): void => {
    tag.update()
    tags.value.set(tag.id, tag)
    _updateCategories()
  }
  const _updateTag = (tag: Tag): void => {
    tag.update()
    tags.value.set(tag.id, tag)

    _updateCategories()
  }
  const _deleteTag = (tag: Tag): void => {
    const tagId = tag.id

    tags.value.delete(tagId)
    lastUsedTags.value.delete(tagId)

    _updateCategories()
  }
  const _setCategories = (cats: Array<TagCategory>): void => {
    categories.value.setValues(cats.map((cat) => [ cat.id, cat ]))
  }
  const _addCategory = (cat: TagCategory): void => {
    cat.update()
    categories.value.set(cat.id, cat)
    _updateTags()
  }
  const _updateCategory = (cat: TagCategory): void => {
    cat.update()
    categories.value.set(cat.id, cat)
    _updateTags()
  }
  const _deleteCategory = (cat: TagCategory): void => {
    categories.value.delete(cat.id)
    _updateTags()
  }

  const _updateTags = (): void => {
    tags.value.forEach((tag) => tag.update())
  }
  const _updateCategories = (): void => {
    categories.value.forEach((cat) => cat.update())
  }
  // #endregion Mutations

  // #region Actions
  async function initStore (): Promise<void> {
    // TODO: ENH: show error alert if fail to fetch tags or categories.
    try {
      taggerReadyPromise.value = Promise.all([
        _fetchTags(),
        _fetchCategories(),
      ]).then(() => {})

      await taggerReadyPromise.value

      _updateTags()
      _updateCategories()
    } catch (e) {
      onError(e, {
        actionName: 'initStore',
      })
    }

    taggerReady.value = true
  }

  async function addTag (tagData: TagData): Promise<void> {
    try {
      const tag = await addTagAPI(tagData)

      if (!tag) {
        throw onError('Fail to add a new tag.')
      }

      _addTag(tag)
    } catch (e) {
      onError(e, {
        actionName: 'TAGGER_A_ADD_TAG',
      })
    }
  }

  async function updateTag (tagData: TagData): Promise<void> {
    try {
      const tag = await updateTagAPI(tagData)

      if (!tag) {
        throw onError('Fail to update tag.')
      }

      _updateTag(tag)
    } catch (e) {
      onError(e, {
        actionName: 'TAGGER_A_UPDATE_TAG',
      })
    }
  }

  async function deleteTag (tagId: Tag | TagId): Promise<void> {
    const tag = typeof tagId === 'string'
      ? getTag(tagId)
      : tagId

    if (!tag) {
      throw onError(`Tag not found: ${tagId}`)
    }

    try {
      const success = await deleteTagAPI(tag)

      if (!success) {
        throw onError('Fail to delete tag.')
      }

      _deleteTag(tag)
    } catch (e) {
      onError(e, {
        actionName: 'TAGGER_A_DELETE_TAG',
      })
    }
  }

  async function addCategory (categoryData: TagCategoryData): Promise<void> {
    try {
      const category = await addCategoryAPI(categoryData)

      if (!category) {
        throw onError('Fail to add a new category.')
      }

      _addCategory(category)
    } catch (e) {
      onError(e, {
        actionName: 'TAGGER_A_ADD_CATEGORY',
      })
    }
  }

  async function updateCategory (categoryData: TagCategoryData): Promise<void> {
    try {
      const category = await updateCategoryAPI(categoryData)

      if (!category) {
        throw onError('Fail to update category.')
      }

      _updateCategory(category)
    } catch (e) {
      onError(e, {
        actionName: 'TAGGER_A_UPDATE_CATEGORY',
      })
    }
  }

  async function deleteCategory (categoryId: TagCategory | TagCategoryId): Promise<void> {
    const category = typeof categoryId === 'string'
      ? getCategory(categoryId)
      : categoryId

    if (!category) {
      throw onError(`Tag not found: ${categoryId}`)
    }

    try {

      const promises = tagsList.value.map((tag) => {
        if (tag.categoryId !== categoryId) { return Promise.resolve(true) }

        const tagData = tag.getData()
        tagData.categoryId = '0'
        return updateTag(tagData).then(() => true).catch(() => false)
      })

      promises.unshift(deleteCategoryAPI(category))

      const results = await Promise.all(promises)

      const success = results.every((success) => success)

      if (!success) {
        throw onError('Fail to delete category.')
      }

      _deleteCategory(category)
    } catch (e) {
      onError(e, {
        actionName: 'TAGGER_A_DELETE_CATEGORY',
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
      onError(e, {
        actionName: 'TAGGER_A_FETCH_TAGS',
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
      onError(e, {
        actionName: 'TAGGER_A_FETCH_TAGS',
      })
    }

    _setCategoriesFetched(true)

    return categories.value
  }
  // #endregion Actions

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
    addLastUsedTag,

    // Actions
    initStore,
    addTag,
    updateTag,
    deleteTag,
    addCategory,
    updateCategory,
    deleteCategory,
  }
})
