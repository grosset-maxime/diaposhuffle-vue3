<script setup lang="ts">
// TODO: Enh: On tag focus change, scroll to the focused tag.
// TODO: Enh: On filter by category update focused tag position.
// TODO: Enh: On sort update focused tag position.
// TODO: Feature: On up/down keydown, focus above/below tags section.
// TODO: Enh: On up/down left/right keydown set tag focus to right tag.
// TODO: Bug: Error on set tag when items come from the bdd.

// Types
import type { TagCategoryId, TagId, Tag, TagData, TagCategoryData } from '@/models/tag'

// Vendors Libs
import { ref, computed, watch } from 'vue'
import { whenever } from '@vueuse/shared'
import Fuse from 'fuse.js'

// Stores
import { useTaggerStore } from '@/stores/tagger'

// Utils
import { SHAKE_ANIMATION_TIME, isEmptyObj, getRandomElement } from '@/utils/utils'

import { useKeyboardShortcutsListener } from '@/composables/keyboardShortcutsListener'

// Components
import CategoriesList from './CategoriesList.vue'
import CircularLoading from '../CircularLoading.vue'
import TagsList from './TagsList.vue'
import EditTagModal from './EditTagModal.vue'
import EditCategoryModal from './EditCategoryModal.vue'

const taggerStore = useTaggerStore()
const { startListener, stopListener } = useKeyboardShortcutsListener(keyboardShortcuts)

const SELECTED_FOCUSED_SECTION_NAME = 'selectedTags'
const UNSELECTED_FOCUSED_SECTION_NAME = 'unselectedTags'
const LAST_USED_FOCUSED_SECTION_NAME = 'lastUsedTags'

const sectionsNames = [
  SELECTED_FOCUSED_SECTION_NAME,
  LAST_USED_FOCUSED_SECTION_NAME,
  UNSELECTED_FOCUSED_SECTION_NAME,
]

// Props
interface Props {
  selected?: Set<TagId>;
  editMode?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  selected: (): Set<TagId> => new Set(),
  editMode: false,
})

// Emits
const emit = defineEmits<{
  (e: 'select', tagId: TagId): void;
  (e: 'unselect', tagId: TagId): void;
  (e: 'save'): void;
  (e: 'cancel'): void;
  (e: 'toggleOpacity'): void;
  (e: 'toggleOpacity'): void;
}>()

// Refs
const selectedTagIdsSet = ref<Set<TagId>>(new Set(props.selected))
const selectedCategoryIdsSet = ref<Set<TagCategoryId>>(new Set())
const tagsFilterInfoMap = new Map()

const focused = ref({
  id: '',
  pos: 0,
  section: UNSELECTED_FOCUSED_SECTION_NAME,
})

const DEFAULT_FILTERS: {
  text: string;
  categories: Map<TagCategoryId, boolean>;
} = {
  text: '',
  categories: new Map(),
}
const filters = ref({ ...DEFAULT_FILTERS })

const sorts = ref({
  field: 'name',
  direction: 'asc',

  fieldItems: [
    { text: 'Name', value: 'name' },
    { text: 'Category', value: 'category' },
  ],

  directionItems: [
    { text: 'A - Z', value: 'asc' },
    { text: 'Z - A', value: 'desc' },
  ],
})

const isFilterTextHasFocus = ref(false)

const isLoading = ref(true)

const shake = ref<Map<string, boolean>>(new Map())

const editTagModal = ref<{
  show: boolean;
  add: boolean;
  tagId: TagId | undefined;
}>({
  show: false,
  add: false,
  tagId: undefined,
})

const editCategoryModal = ref<{
  show: boolean;
  add: boolean;
  categoryId: TagCategoryId | undefined;
}>({
  show: false,
  add: false,
  categoryId: undefined,
})

// TODO
const filterTextCmp = ref<{
  focus: Function;
} | null>(null)

// Computeds
const tagsList = taggerStore.tagsList

//#region Computeds
const sortedTags = computed(() => {
  return [ ...tagsList.value ].sort((tagA, tagB) => {
    let sort = 0
    const direction = sorts.value.direction === 'asc'
      ? 1
      : -1
    const field = sorts.value.field || 'name'

    if (field === 'name') {
      sort = tagA.name.localeCompare(tagB.name)
    }
    if (field === 'category') {
      sort = tagA.categoryId.localeCompare(tagB.categoryId)
    }

    return direction * sort
  })
})

const categoriesMap = taggerStore.categories
const categoriesList = taggerStore.categoriesList

const categoryIds = computed<Array<TagCategoryId>>(() => {
  return [ ...categoriesList.value ]
    .sort((catA, catB) => {
      let sort = 0
      const direction = sorts.value.direction === 'asc'
        ? 1
        : -1
      const field = sorts.value.field || 'name'

      if (field === 'name') {
        sort = catA.name.localeCompare(catB.name)
      }
      if (field === 'category') {
        sort = catA.id.localeCompare(catB.id)
      }

      return direction * sort
    })
    .map((cat) => cat.id)
})

const selectedTagIds = computed(() => {
  let sortedTagsValue = sortedTags.value

  sortedTagsValue = sortedTagsValue.filter((tag) => selectedTagIdsSet.value.has(tag.id))

  let tagsIds = sortedTagsValue.map((tag) => tag.id)

  if (isFiltering.value) {
    const filteredTagsIds = filteredTagsList.value
      .filter((tag) => selectedTagIdsSet.value.has(tag.id))
      .map((tag) => tag.id)

    const filteredTagsIdsMap = Object.fromEntries(filteredTagsIds.map((id) => [ id, true ]))

    tagsIds = tagsIds.filter((id) => !filteredTagsIdsMap[ id ])

    tagsIds = filteredTagsIds.concat(tagsIds)
  }

  return tagsIds
})

const lastUsedTagIdsMap = taggerStore.lastUsedTagIdsMap

/**
 * @returns List of last used tags ids.
 */
const lastUsedTagIds = computed(() => {
  let tagsIds = Array.from(lastUsedTagIdsMap.value.keys())

  if (isFiltering.value) {
    const filteredTagsIds = filteredTagsList.value
      .filter((tag) => lastUsedTagIdsMap.value.has(tag.id))
      .map((tag) => tag.id)

    const filteredTagsIdsMap = Object.fromEntries(filteredTagsIds.map((id) => [ id, true ]))

    tagsIds = tagsIds.filter((id) => !filteredTagsIdsMap[ id ])

    tagsIds = filteredTagsIds.concat(tagsIds)
  }

  return tagsIds.filter((tagId) => !selectedTagIdsSet.value.has(tagId))
})

/**
 * @returns List of unselected tags ids.
 */
const unselectedTagIds = computed(() => {
  let sortedTagsValue = sortedTags.value

  sortedTagsValue = sortedTagsValue.filter((tag) => !selectedTagIdsSet.value.has(tag.id))

  let tagsIds = sortedTagsValue.map((tag) => tag.id)

  if (isFiltering.value) {
    const filteredTagsIds = filteredTagsList.value
      .filter((tag) => !selectedTagIdsSet.value.has(tag.id))
      .map((tag) => tag.id)

    const filteredTagsIdsMap = Object.fromEntries(filteredTagsIds.map((id) => [ id, true ]))

    tagsIds = tagsIds.filter((id) => !filteredTagsIdsMap[ id ])

    tagsIds = filteredTagsIds.concat(tagsIds)
  }

  return tagsIds
})

const filteredTagsList = computed(() => {
  if (!isFiltering.value) {
    return []
  }

  let tagsValue = tagsList.value

  if (hasCategoriesFilter.value) {
    tagsValue = applyCategoriesFilter(tagsList.value)
  }

  if (filters.value.text) {
    const results = applyTextFilter<Tag>(tagsList.value)

    // filters.textResults = results;

    tagsValue = results.map((r) => {
      // console.log(r);
      const tag = r.item
      tagsFilterInfoMap.set(tag.id, r)

      return tag
    })
  }

  return tagsValue
})

const filteredTagsMap = computed(() => {
  return Object.fromEntries(filteredTagsList.value.map((tag) => [ tag.id, tag ]))
})

const notFilteredSelectedTagIdsMap = computed(() => {
  if (!isFiltering.value) {
    return new Map()
  }

  const notFilteredTagIds = selectedTagIds.value.filter(
    (tagId) => !(tagId in filteredTagsMap.value),
  )

  return new Map(notFilteredTagIds.map((tagId) => [ tagId, true ]))
})

const notFilteredLastUsedTagIdsMap = computed(() => {
  if (!isFiltering.value) {
    return new Map()
  }

  const notFilteredTagIds = lastUsedTagIds.value.filter(
    (tagId) => !(tagId in filteredTagsMap.value),
  )

  return new Map(notFilteredTagIds.map((tagId) => [ tagId, true ]))
})

const notFilteredUnselectedTagIdsMap = computed(() => {
  if (!isFiltering.value) {
    return new Map()
  }

  const notFilteredTagIds = unselectedTagIds.value.filter(
    (tagId) => !(tagId in filteredTagsMap.value),
  )

  return new Map(notFilteredTagIds.map((tagId) => [ tagId, true ]))
})

const notFilteredCategoryIdsMap = computed<Map<TagCategoryId, boolean>>(() => {
  if (!filters.value.text) {
    return new Map()
  }

  const categories = Array.from(categoriesMap.value.values())

  const matchedCategoryIdsMap = Object.fromEntries(
    applyTextFilter(categories)
      .filter((r) => (r.score || 0) < 0.5)
      .map((r) => [ r.item.id, true ]),
  )

  const notFilteredCategory = Object.keys(categoriesMap.value).filter(
    (catId) => !matchedCategoryIdsMap[ catId ],
  )

  return new Map(notFilteredCategory.map((catId) => [ catId, true ]))
})

const isFiltering = computed(() => {
  return hasCategoriesFilter.value || filters.value.text
})

const hasCategoriesFilter = computed(() => {
  return !isEmptyObj(filters.value.categories)
})

const noSelectedTagsText = computed(() => {
  return isFiltering.value && !selectedTagIdsSet.value.size
    ? 'No tags results'
    : 'No tags selected'
})

const noLastUsedTagsText = computed(() => {
  return isFiltering.value
    ? 'No tags results'
    : 'No last used tags'
})

const noUnselectedTagsText = computed(() => {
  return isFiltering.value
    ? 'No tags results'
    : ''
})
//#endregion Computeds

//#region Methods
function onHide () {
  stopListener()
}

function onSelectCategory (catId: TagCategoryId) {
  selectedCategoryIdsSet.value.add(catId)
  filters.value.categories.set(catId, true)
}

function onUnselectCategory (catId: TagCategoryId) {
  selectedCategoryIdsSet.value.delete(catId)
  filters.value.categories.delete(catId)
}

function onTagClick (tagId: TagId) {
  if (selectedTagIdsSet.value.has(tagId)) {
    selectedTagIdsSet.value.delete(tagId)
    emit('unselect', tagId)
  } else {
    selectedTagIdsSet.value.add(tagId)
    emit('select', tagId)

    addLastUsedTagId(tagId)
  }

  // TODO: ENH: if focused tag, move/update focused position.
  // TODO: ENH: on select last tag from a section, set focus on upper section.
  if (focused.value.pos === unselectedTagIds.value.length) {
    focused.value.pos -= 2
  } else {
    focused.value.pos -= 1
  }

  setFocusRight()
}

function onFilterTextFocus () {
  isFilterTextHasFocus.value = true
}

function onFilterTextBlur () {
  isFilterTextHasFocus.value = false
}

async function onDeleteEditTagModal (tagId: TagId) {
  await taggerStore.deleteTag(tagId)

  updateSelectedTagIdsMap()
  hideEditTagModal()
}

async function onConfirmEditTagModal (tagData: TagData) {
  await (editTagModal.value.add
    ? taggerStore.addTag(tagData)
    : taggerStore.updateTag(tagData))

  updateSelectedTagIdsMap()
  hideEditTagModal()
}

function onCancelEditTagModal () {
  hideEditTagModal()
}

function showAddTagModal () {
  stopListener()
  editTagModal.value.add = true
  editTagModal.value.tagId = undefined
  editTagModal.value.show = true
}

function showEditTagModal (tagId: TagId) {
  stopListener()
  editTagModal.value.add = false
  editTagModal.value.tagId = tagId
  editTagModal.value.show = true
}

function hideEditTagModal () {
  editTagModal.value.show = false
  startListener()
}

async function onDeleteEditCategoryModal (catId: TagCategoryId) {
  await taggerStore.deleteCategory(catId)

  hideEditCategoryModal()
}

async function onConfirmEditCategoryModal (categoryData: TagCategoryData) {
  await (editCategoryModal.value.add
    ? taggerStore.addCategory(categoryData)
    : taggerStore.updateCategory(categoryData))

  hideEditCategoryModal()
}

function onCancelEditCategoryModal () {
  hideEditCategoryModal()
}

function showAddCategoryModal () {
  stopListener()
  editCategoryModal.value.add = true
  editCategoryModal.value.categoryId = undefined
  editCategoryModal.value.show = true
}

function showEditCategoryModal (catId: TagCategoryId) {
  stopListener()
  editCategoryModal.value.add = false
  editCategoryModal.value.categoryId = catId
  editCategoryModal.value.show = true
}

function hideEditCategoryModal () {
  editCategoryModal.value.show = false
  startListener()
}

function clearFilterText () {
  filters.value.text = ''
}

function setFilterTextFocus () {
  filterTextCmp.value?.focus()
}

function selectRandom () {
  const randomdTagId = getRandomElement(unselectedTagIds.value)

  if (randomdTagId) {
    onTagClick(randomdTagId)
  }

  setFilterTextFocus()
}

function addLastUsedTagId (tagId: TagId) {
  taggerStore.addLastUsedTagId(tagId)
}

function applyCategoriesFilter (tags: Array<Tag>) {
  return tags.filter((tag) => !!filters.value.categories.get(tag.categoryId))
}

function applyTextFilter<T> (array: Array<T>, keys: Array<string> = [ 'name' ]) {
  const options = {
    includeScore: true,
    includeMatches: true,
    keys,
  }

  const fuse = new Fuse(array, options)
  return fuse.search(filters.value.text)
}

function updateSelectedTagIdsMap () {
  selectedTagIdsSet.value = new Set(props.selected)
}

function resetFocus () {
  const sectionName = focused.value.section
  const sectionTagIds = getTagIdsFromSectionName(sectionName);
  [ focused.value.id ] = sectionTagIds
  focused.value.pos = 0
}

function resetFilters () {
  filters.value = { ...DEFAULT_FILTERS }
}

function checkSectionName (name: string) {
  shake.value.set(name, true)
  setTimeout(() => {
    shake.value.set(name, false)
  }, SHAKE_ANIMATION_TIME)
}

function getTagIdsFromSectionName (name: string) {
  let tagsIds: Array<string> = []

  if (name === UNSELECTED_FOCUSED_SECTION_NAME) {
    tagsIds = unselectedTagIds.value
  } else if (name === SELECTED_FOCUSED_SECTION_NAME) {
    tagsIds = selectedTagIds.value
  } else if (name === LAST_USED_FOCUSED_SECTION_NAME) {
    tagsIds = lastUsedTagIds.value
  }
  return tagsIds
}

function getUpperSectionFrom (name: string) {
  let upperSectionName = ''
  let sectionTagIds
  let index = 0
  const indexSectionFrom = sectionsNames.indexOf(name)

  for (let i = 1; i <= sectionsNames.length; i += 1) {
    index = indexSectionFrom - i
    if (index < 0) {
      index = sectionsNames.length + indexSectionFrom - i
    }
    upperSectionName = sectionsNames[ index ]
    sectionTagIds = getTagIdsFromSectionName(upperSectionName)
    if (sectionTagIds.length) {
      break
    }
  }

  return upperSectionName
}

function getDownerSectionFrom (name: string) {
  let downerSectionName = ''
  let sectionTagIds
  let index = 0
  const indexSectionFrom = sectionsNames.indexOf(name)

  for (let i = 1; i <= sectionsNames.length; i += 1) {
    index = indexSectionFrom + i
    if (index >= sectionsNames.length) {
      index = indexSectionFrom + i - sectionsNames.length
    }
    downerSectionName = sectionsNames[ index ]
    sectionTagIds = getTagIdsFromSectionName(downerSectionName)
    if (sectionTagIds.length) {
      break
    }
  }

  return downerSectionName
}

function setFocusRight () {
  const sectionName = focused.value.section
  const sectionTagIds = getTagIdsFromSectionName(sectionName)

  focused.value.pos += 1
  if (focused.value.pos >= sectionTagIds.length) {
    focused.value.pos = 0
  }
  focused.value.id = sectionTagIds[ focused.value.pos ]
}

function setFocusLeft () {
  const sectionName = focused.value.section
  const sectionTagIds = getTagIdsFromSectionName(sectionName)

  focused.value.pos -= 1
  if (focused.value.pos < 0) {
    focused.value.pos = sectionTagIds.length - 1
  }
  focused.value.id = sectionTagIds[ focused.value.pos ]
}

function setFocusUp () {
  const sectionName = focused.value.section
  let upperSectionName = getUpperSectionFrom(sectionName)

  if (!upperSectionName) {
    upperSectionName = UNSELECTED_FOCUSED_SECTION_NAME
  }

  if (sectionName !== upperSectionName) {
    focused.value.section = upperSectionName
    resetFocus()
  } else {
    checkSectionName(sectionName)
  }
}

function setFocusDown () {
  const sectionName = focused.value.section
  let downerSectionName = getDownerSectionFrom(sectionName)

  if (!downerSectionName) {
    downerSectionName = UNSELECTED_FOCUSED_SECTION_NAME
  }

  if (sectionName !== downerSectionName) {
    focused.value.section = downerSectionName
    resetFocus()
  } else {
    checkSectionName(sectionName)
  }
}

function keyboardShortcuts (key: string, e: KeyboardEvent) {
  let preventDefault = false
  const stopPropagation = false

  if (e.shiftKey && key !== 'Shift') {
    switch (key) {
    case 'Enter':
      onTagClick(focused.value.id)
      break

    default:
    }
  } else if (e.altKey && key !== 'Alt') {
    switch (key) {
    // On windows, Meta + Enter does not trigger a keydown event,
    // So, set Alt + Enter to validate.
    case 'Enter':
      emit('save')
      preventDefault = true
      break

    default:
    }
  } else if (e.metaKey && key !== 'Meta') {
    // On windows, Alt + Escape does not trigger a keydown event,
    // So, set Meta + Escape to cancel.
    switch (key) {
    case 'Escape':
      emit('cancel')
      preventDefault = true
      break

    default:
    }
  } else {
    switch (key) {
    case 'ArrowRight':
      setFocusRight()
      break

    case 'ArrowLeft':
      setFocusLeft()
      break

    case 'ArrowUp':
      setFocusUp()
      preventDefault = true
      break

    case 'ArrowDown':
      setFocusDown()
      preventDefault = true
      break

    case 'Control':
      emit('toggleOpacity')
      preventDefault = true
      break

    case 'Enter':
      onTagClick(focused.value.id)
      clearFilterText()
      break

    case 'Escape':
      clearFilterText()
      break

    default:
      // Start filtering only if the pressed key is a letter.
      // Do not focus if pressed key is a control one.
      if (!isFilterTextHasFocus.value && key.length === 1) {
        setFilterTextFocus()
        filters.value.text += key
      }
    }
  }

  if (preventDefault) {
    e.preventDefault()
  }
  if (stopPropagation) {
    e.stopPropagation()
  }
}
//#endregion Methods

// Watchers
watch(unselectedTagIds, () => {
  if (!focused.value.id) {
    resetFocus()
  }
})
watch(isFiltering, () => {
  resetFocus()
})

whenever(taggerStore.isTaggerReady, (isTaggerReady: boolean) => {
  if (!isTaggerReady) { return }

  startListener()
  resetFilters()
  resetFocus()

  isLoading.value = false
}, { immediate: true })
</script>

<template>
  <div class="tagger">
    <div v-if="isLoading" class="loading">
      <CircularLoading indeterminate />
    </div>

    <div
      :class="[
        'selected-tags',
        {
          shake: shake.get(SELECTED_FOCUSED_SECTION_NAME),
        },
      ]"
    >
      <TagsList
        :tag-ids="selectedTagIds"
        :focused="focused.section === SELECTED_FOCUSED_SECTION_NAME ? focused : undefined"
        :edit-mode="!!selectedTagIds.length && props.editMode"
        :no-tags-text="noSelectedTagsText"
        :masked="notFilteredSelectedTagIdsMap"
        closable-tags
        @clickTag="onTagClick"
        @closeTag="onTagClick"
        @addTag="showAddTagModal"
        @editTag="showEditTagModal"
      />
    </div>

    <v-divider class="separator" />

    <div class="actions-bar">
      <div class="filter-form input-action">
        <v-text-field
          ref="filterTextCmp"
          :model-value="filters.text"
          label="Filter tags"
          prepend-icon="mdi-magnify"
          clearable
          autofocus
          hide-details
          color="orange"
          @input="filters.text = $event || ''"
          @focus="onFilterTextFocus"
          @blur="onFilterTextBlur"
          @click:prepend="setFilterTextFocus"
        />
      </div>

      <div class="sort-by-field input-action">
        <v-select
          ref="sortByField"
          :model-value="sorts.field"
          :items="sorts.fieldItems"
          color="orange"
          label="Sort By"
          hide-details
          prepend-icon="mdi-sort"
          @input="sorts.field = $event || ''"
        />
      </div>

      <div class="sort-direction input-action">
        <v-select
          ref="sortDirection"
          :model-value="sorts.direction"
          :items="sorts.directionItems"
          label="Sort Direction"
          hide-details
          color="orange"
          prepend-icon="mdi-sort-alphabetical-variant"
          @input="sorts.direction = $event || ''"
        />
      </div>
    </div>

    <!-- TODO: Feature: Show latest used tags -->
    <!-- TODO: Feature: on filtering latest used tags, do not hide it but set opacity. -->

    <!-- TODO: Feature: Mask none selected category when at least one category is selected -->
    <div class="categories-list">
      <CategoriesList
        :category-ids="categoryIds"
        :selected="selectedCategoryIdsSet"
        :masked="notFilteredCategoryIdsMap"
        :edit-mode="props.editMode"
        @select="onSelectCategory"
        @unselect="onUnselectCategory"
        @addCategory="showAddCategoryModal"
        @editCategory="showEditCategoryModal"
      />
    </div>

    <v-divider class="separator" />

    <div
      :class="[
        'last-used-unselected-tags',
        {
          shake: shake.get(LAST_USED_FOCUSED_SECTION_NAME),
        },
      ]"
    >
      <TagsList
        ref="lastUsedTagsList"
        :tag-ids="lastUsedTagIds"
        :focused="focused.section === LAST_USED_FOCUSED_SECTION_NAME ? focused : undefined"
        :masked="notFilteredLastUsedTagIdsMap"
        :edit-mode="false"
        :no-tags-text="noLastUsedTagsText"
        @clickTag="onTagClick"
        @addTag="showAddTagModal"
        @editTag="showEditTagModal"
      />
    </div>

    <v-divider class="separator" />

    <!-- TODO: Feature: Highlight matching text with filtering text -->
    <div
      :class="[
        'unselected-tags',
        {
          shake: shake.get(UNSELECTED_FOCUSED_SECTION_NAME),
        },
      ]"
    >
      <TagsList
        ref="unselectedTagsList"
        :tag-ids="unselectedTagIds"
        :focused="focused.section === UNSELECTED_FOCUSED_SECTION_NAME ? focused : undefined"
        :masked="notFilteredUnselectedTagIdsMap"
        :edit-mode="props.editMode"
        :no-tags-text="noUnselectedTagsText"
        @clickTag="onTagClick"
        @addTag="showAddTagModal"
        @editTag="showEditTagModal"
      />
    </div>

    <EditTagModal
      v-if="editMode"
      :show="editTagModal.show"
      :add="editTagModal.add"
      :tag-id="editTagModal.tagId"
      @delete="onDeleteEditTagModal"
      @confirm="onConfirmEditTagModal"
      @cancel="onCancelEditTagModal"
    />

    <EditCategoryModal
      v-if="editMode"
      :show="editCategoryModal.show"
      :add="editCategoryModal.add"
      :category-id="editCategoryModal.categoryId"
      @delete="onDeleteEditCategoryModal"
      @confirm="onConfirmEditCategoryModal"
      @cancel="onCancelEditCategoryModal"
    />
  </div>
</template>

<style lang="scss" scoped>
.tagger {
  padding: 4px 12px;
  display: flex;
  flex-direction: column;

  .selected-tags {
    flex-shrink: 0;
    overflow: auto;
    min-height: $tag-height;
    max-height: 40%;
    @include w-scrollbar;
  }

  .actions-bar {
    display: flex;
    align-items: center;
    margin-bottom: 25px;

    .input-action {
      margin-right: 60px;
    }

    .filter-form {
      width: 300px;
    }

    .sort-by-field,
    .sort-direction {
      width: 150px;
      opacity: 0.5;
    }
  }

  .categories-list {
    display: flex;
  }

  .unselected-tags {
    overflow: auto;
    @include w-scrollbar;
  }

  .separator {
    margin: 8px 0;
  }

  .shake {
    @include shake-animation;
  }
}
.loading {
  position: absolute;
  height: 100vh;
  width: 100vw;
  background: #000000AA;
  z-index: 1000;
}
</style>
