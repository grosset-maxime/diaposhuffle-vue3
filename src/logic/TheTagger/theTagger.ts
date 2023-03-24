
// Types
import type { Ref } from 'vue'
import type { TagCategoryId, TagId, Tag, TagCategory } from '@/models/tag'

// Vendors Libs
import { computed } from 'vue'
import Fuse from 'fuse.js'

// Stores
import { useTaggerStore } from '@/stores/tagger'

export interface Sort {
    field: 'name' | 'category'
    direction: 'asc' | 'desc'
}

export interface FilteredTagResult {
  tag: Tag,
  score: number
}
export interface FilteredCategoryResult {
  category: TagCategory,
  score: number
}

function applyTextFilter<T> (
  query: string,
  array: Array<T>,
  keys: Array<string> = [ 'name' ],
) {
  const options = {
    includeScore: true,
    includeMatches: true,
    shouldSort: true,
    keys,
  }

  const fuse = new Fuse(array, options)
  return fuse.search(query)
}

function applyCategoriesFilter (tags: Array<Tag>, categories: Set<TagCategoryId>) {
  return tags.filter((tag) => categories.has(tag.categoryId))
}

function sortTagsFn (
  field: Sort['field'] = 'name',
  dir: Sort['direction'] = 'asc',
) {
  return function (tagA: Tag, tagB: Tag) {
    let sort = 0
    const direction = dir === 'asc'
      ? 1
      : -1

    if (field === 'name') {
      sort = tagA.name.localeCompare(tagB.name)
    }
    if (field === 'category') {
      sort = tagA.categoryId.localeCompare(tagB.categoryId)
    }

    return direction * sort
  }
}

function sortTagCategoriesFn (
  field: Sort['field'] = 'name',
  dir: Sort['direction'] = 'asc',
) {
  return function (catA: TagCategory, catB: TagCategory) {
    let sort = 0
    const direction = dir === 'asc'
      ? 1
      : -1

    if (field === 'name') {
      sort = catA.name.localeCompare(catB.name)
    }
    if (field === 'category') {
      sort = catA.id.localeCompare(catB.id)
    }

    return direction * sort
  }
}

function applyTagFiltering ({
  isFiltering,
  list,
  categoriesFilter,
  textFilter,
}: {
  isFiltering: boolean
  list: Array<Tag>
  categoriesFilter?: Set<TagCategoryId>
  textFilter?: string
}) {
  const filteredMap: Map<TagId, FilteredTagResult> = new Map()

  if (!isFiltering) {
    return filteredMap
  }

  let filteredList = [ ...list ]

  if (categoriesFilter && categoriesFilter.size) {
    filteredList = applyCategoriesFilter(
      filteredList, categoriesFilter,
    )

    if (!textFilter) {
      filteredList.forEach((tag) => {
        filteredMap.set(tag.id, {
          tag,
          score: 0,
        })
      })
    }
  }

  if (textFilter) {
    const results = applyTextFilter<Tag>(textFilter, filteredList)

    results.forEach((r) => {
      // console.log(r);
      const tag = r.item

      filteredMap.set(tag.id, {
        tag,
        score: r.score || 1,
      })
    })
  }

  list.forEach((tag) => {
    if (!filteredMap.has(tag.id)) {
      filteredMap.set(tag.id, {
        tag,
        score: 1,
      })
    }
  })

  return filteredMap
}

function applyCategoryFiltering ({
  isFiltering,
  list,
  textFilter,
}: {
  isFiltering: boolean
  list: Array<TagCategory>
  textFilter?: string
}) {
  const filteredResults: Map<TagCategoryId, FilteredCategoryResult> = new Map()

  if (!isFiltering) {
    return filteredResults
  }

  if (textFilter) {
    const results = applyTextFilter<TagCategory>(textFilter, list)

    results.forEach((r) => {
      // console.log(r);
      const category = r.item

      filteredResults.set(category.id, {
        category,
        score: r.score || 1,
      })
    })
  }

  list.forEach((category) => {
    if (!filteredResults.has(category.id)) {
      filteredResults.set(category.id, {
        category,
        score: 1,
      })
    }
  })

  return filteredResults
}

interface Filter {
  text: string
  categories: Set<TagCategoryId>
}
interface UseTheTagger {
  selectedTagsIdsSet: Ref<Set<TagId>>
  isFiltering: Readonly<Ref<boolean>>
  filters: Ref<Filter>
  sorts: Ref<Sort>
}

export const useTheTagger = ({
  selectedTagsIdsSet,
  isFiltering,
  filters,
  sorts,
}: UseTheTagger) => {

  const taggerStore = useTaggerStore()
  const tagsMap = taggerStore.tags
  const tagsList = taggerStore.tagsList
  const categoriesList = taggerStore.categoriesList
  const lastUsedTagsList = taggerStore.lastUsedTagsList

  //#region Sorted Tags & Categories & LastUsedTags
  const sortedTagsList = computed(
    () => [ ...tagsList.value ].sort(sortTagsFn(sorts.value.field, sorts.value.direction)),
  )
  const sortedTagsMap = computed(
    () => new Map(sortedTagsList.value.map((tag) => [ tag.id, tag ])),
  )

  const sortedCategoriesList = computed(
    () => [ ...categoriesList.value ].sort(
      sortTagCategoriesFn(sorts.value.field, sorts.value.direction),
    ),
  )
  const sortedCategoiesMap = computed(
    () => new Map(sortedCategoriesList.value.map((cat) => [ cat.id, cat ])),
  )

  const sortedLastUsedTagsList = computed(
    () => [ ...lastUsedTagsList.value ]
      .sort((tagA, tagB) => tagA.lastUsed - tagB.lastUsed),
  )
  const sortedLastUsedTagsMap = computed(
    () => new Map(sortedLastUsedTagsList.value.map((tag) => [ tag.id, tag ])),
  )
  //#endregion Sorted Tags & Categories & LastUsedTags

  //#region Filtered Tags & Categories & LastUsedTags
  const filteredTagsResultsMap = computed(
    () => applyTagFiltering({
      isFiltering: isFiltering.value,
      list: sortedTagsList.value,
      categoriesFilter: isFiltering.value
        ? filters.value.categories
        : undefined,
      textFilter: isFiltering.value
        ? filters.value.text
        : undefined,
    }),
  )
  const filteredTagsMap = computed(
    () => new Map(
      Array.from(filteredTagsResultsMap.value)
        .map((value) => [ value[ 0 ], value[ 1 ].tag ]),
    ),
  )

  const filteredCategoriesResultsMap = computed(
    () => applyCategoryFiltering({
      isFiltering: isFiltering.value,
      list: sortedCategoriesList.value,
      textFilter: isFiltering.value
        ? filters.value.text
        : undefined,
    }),
  )
  const filteredCategoriesMap = computed(
    () => new Map(
      Array.from(filteredCategoriesResultsMap.value)
        .map((value) => [ value[ 0 ], value[ 1 ].category ]),
    ),
  )

  const filteredLastUsedTagsResultsMap = computed(
    () => applyTagFiltering({
      isFiltering: isFiltering.value,
      list: sortedLastUsedTagsList.value,
      categoriesFilter: isFiltering.value
        ? filters.value.categories
        : undefined,
      textFilter: isFiltering.value
        ? filters.value.text
        : undefined,
    }),
  )
  const filteredLastUsedTagsMap = computed(
    () => new Map(
      Array.from(filteredLastUsedTagsResultsMap.value)
        .map((value) => [ value[ 0 ], value[ 1 ].tag ]),
    ),
  )
  //#endregion Filtered Tags & Categories & LastUsedTags

  //#region Selected Tags section
  const selectedTagsMap = computed(() => {
    const tagsMap: Map<TagId, Tag> = new Map()
    const mapToFilter = isFiltering.value
      ? filteredTagsMap.value
      : sortedTagsMap.value

    mapToFilter.forEach((tag, tagId) => {
      if(selectedTagsIdsSet.value.has(tagId)){
        tagsMap.set(tagId, tag)
      }
    })

    return tagsMap
  })
  //#endregion Selected Tags section

  //#region Categories section
  const categoriesMap = computed(
    () => isFiltering.value
      ? filteredCategoriesMap.value
      : sortedCategoiesMap.value,
  )

  // TODO
  const nbTagsPerCategoryMap = computed(() => {
    const nbTagsMap: Map<TagCategoryId, number> = new Map()
    const tagIds = tagsList.value.map((tag) => tag.id)

    Array.from(categoriesMap.value.keys()).forEach((catId) => {
      nbTagsMap.set(
        catId,
        tagIds.filter(
          (tagId) => tagsMap.value.get(tagId)?.categoryId === catId,
        ).length,
      )
    })

    return nbTagsMap
  })
  //#endregion Categories section

  //#region Last Used Tags section
  const lastUsedTagsMap = computed(
    () => isFiltering.value
      ? filteredLastUsedTagsMap.value
      : sortedLastUsedTagsMap.value,
  )
  //#endregion Last Used Tags section

  //#region Unselected Tags section
  const unselectedTagsMap = computed(() => {
    const tagsMap: Map<TagId, Tag> = new Map()
    const mapToFilter = isFiltering.value
      ? filteredTagsMap
      : sortedTagsMap

    mapToFilter.value.forEach((tag, tagId) => {
      if(!selectedTagsIdsSet.value.has(tagId)){
        tagsMap.set(tagId, tag)
      }
    })

    return tagsMap
  })
  //#endregion Unselected Tags section

  return {
    selectedTagsMap,

    categoriesMap,
    filteredCategoriesResultsMap,
    nbTagsPerCategoryMap,

    lastUsedTagsMap,
    filteredLastUsedTagsResultsMap,

    unselectedTagsMap,
    filteredTagsResultsMap,
  }
}
