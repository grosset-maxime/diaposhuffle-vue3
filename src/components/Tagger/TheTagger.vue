<script setup lang="ts">
// TODO: Enh: On tag focus change, scroll to the focused tag.
// TODO: Enh: On filter by category update focused tag position.
// TODO: Enh: On sort update focused tag position.
// TODO: Feature: On up/down keydown, focus above/below tags section.
// TODO: Enh: On up/down left/right keydown set tag focus to right tag.

// TODO: Bug: Error on set tag when items come from the bdd. => Already fixed ??

// Types
import type { TagCategoryId, TagId, TagData, TagCategoryData } from '@/models/tag'
import type { Sort } from '@/logic/TheTagger/theTagger'

// Vendors Libs
import { ref, watch } from 'vue'
import { eagerComputed, whenever } from '@vueuse/shared'

// Stores
import { useTaggerStore } from '@/stores/tagger'

// Utils
import { SHAKE_ANIMATION_TIME, getRandomElement } from '@/utils/utils'

import { useKeyboardShortcutsListener } from '@/composables/keyboardShortcutsListener'
import { useTheTagger } from '@/logic/TheTagger/theTagger'

// Components
import CategoriesList from './CategoriesList.vue'
import CircularLoading from '../CircularLoading.vue'
import TagsList from './TagsList.vue'
import EditTagModal from './EditTagModal.vue'
import EditCategoryModal from './EditCategoryModal.vue'

const taggerStore = useTaggerStore()
const { startListener, stopListener } = useKeyboardShortcutsListener(keyboardShortcuts)

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

//#region Refs
const selectedTagsIdsSet = ref<Set<TagId>>(new Set(props.selected))
const isLoading = ref(true)
//#endregion Refs

//#region Filtering section
const filters = ref<{
  text: string;
  categories: Set<TagCategoryId>;
}>({
  text: '',
  categories: new Set(),
})

const sorts = ref<Sort>({
  field: 'name',
  direction: 'asc',
})

const SORTS_SELECT_OPTS = {
  fieldItems: [
    { title: 'Name', value: 'name' },
    { title: 'Category', value: 'category' },
  ],

  directionItems: [
    { title: 'A - Z', value: 'asc' },
    { title: 'Z - A', value: 'desc' },
  ],
}

const filterTextCmp = ref<{
  focus: () => void;
    } | null>(null)

const isFilterTextHasFocus = ref(false)

const hasCategoriesFilter = eagerComputed(() => !!filters.value.categories.size)

const isFiltering = eagerComputed(
  () => !!(hasCategoriesFilter.value || filters.value.text),
)

function onSelectCategory (catId: TagCategoryId) {
  filters.value.categories.add(catId)
}

function onUnselectCategory (catId: TagCategoryId) {
  filters.value.categories.delete(catId)
}

function onFilterTextFocus () {
  isFilterTextHasFocus.value = true
}

function onFilterTextBlur () {
  isFilterTextHasFocus.value = false
}

function clearFilterText () {
  filters.value.text = ''
}

function setFilterTextFocus () {
  filterTextCmp.value?.focus()
}

function resetFilters () {
  filters.value = { text: '', categories: new Set() }
}
//#endregion Filtering section

const {
  selectedTagsMap,

  categoriesMap,
  filteredCategoriesResultsMap,
  nbTagsPerCategoryMap,

  lastUsedTagsMap,
  filteredLastUsedTagsResultsMap,

  unselectedTagsMap,
  filteredTagsResultsMap,
} = useTheTagger({
  selectedTagsIdsSet,
  isFiltering,
  filters,
  sorts,
})

//#region Methods
function onTagClick (tagId: TagId) {
  if (selectedTagsIdsSet.value.has(tagId)) {
    selectedTagsIdsSet.value.delete(tagId)
    emit('unselect', tagId)
  } else {
    selectedTagsIdsSet.value.add(tagId)
    emit('select', tagId)

    addLastUsedTag(tagId)
  }

  // TODO: ENH: if focused tag, move/update focused position.
  // TODO: ENH: on select last tag from a section, set focus on upper section.
  if (focused.value.pos === unselectedTagsMap.value.size) {
    focused.value.pos -= 2
  } else {
    focused.value.pos -= 1
  }

  setFocusRight()
}

function selectRandom () {
  const randomdTagId = getRandomElement(Array.from(unselectedTagsMap.value.keys()))

  if (randomdTagId) {
    onTagClick(randomdTagId)
  }

  setFilterTextFocus()
}

function addLastUsedTag (tagId: TagId) {
  taggerStore.addLastUsedTag(tagId)
}

function updateSelectedTagIdsMap () {
  selectedTagsIdsSet.value = new Set(props.selected)
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
        // filters.value.text += key
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

//#region Focus Management
const SELECTED_FOCUSED_SECTION_NAME = 'selectedTags'
const UNSELECTED_FOCUSED_SECTION_NAME = 'unselectedTags'
const LAST_USED_FOCUSED_SECTION_NAME = 'lastUsedTags'

const sectionsNames = [
  SELECTED_FOCUSED_SECTION_NAME,
  LAST_USED_FOCUSED_SECTION_NAME,
  UNSELECTED_FOCUSED_SECTION_NAME,
]

const focused = ref({
  id: '',
  pos: 0,
  section: UNSELECTED_FOCUSED_SECTION_NAME,
})

const shake = ref<Map<string, boolean>>(new Map())

function resetFocus () {
  const sectionName = focused.value.section
  const sectionTagIds = getTagIdsFromSectionName(sectionName);
  [ focused.value.id ] = sectionTagIds
  focused.value.pos = 0
}

function shakeSectionName (name: string) {
  shake.value.set(name, true)

  setTimeout(() => {
    shake.value.set(name, false)
  }, SHAKE_ANIMATION_TIME)
}

function getTagIdsFromSectionName (name: string) {
  let tagsIds: Array<string> = []

  if (name === UNSELECTED_FOCUSED_SECTION_NAME) {
    tagsIds = Array.from(unselectedTagsMap.value.keys())
  } else if (name === SELECTED_FOCUSED_SECTION_NAME) {
    tagsIds = Array.from(selectedTagsMap.value.keys())
  } else if (name === LAST_USED_FOCUSED_SECTION_NAME) {
    tagsIds = Array.from(lastUsedTagsMap.value.keys())
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
    shakeSectionName(sectionName)
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
    shakeSectionName(sectionName)
  }
}
//#endregion Focus Management

//#region Watchers
watch(unselectedTagsMap, () => {
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
//#endregion Watchers

//#region Edit/Add Tag Modal
const editTagModal = ref<{
  show: boolean;
  add: boolean;
  tagId: TagId | undefined;
}>({
  show: false,
  add: false,
  tagId: undefined,
})

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
//#endregion Edit/Add Tag Modal

//#region Edit/Add TagCategory Modal
const editCategoryModal = ref<{
  show: boolean;
  add: boolean;
  categoryId: TagCategoryId | undefined;
}>({
  show: false,
  add: false,
  categoryId: undefined,
})

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
//#endregion Edit/Add TagCategory Modal

const noSelectedTagsText = eagerComputed(() => {
  return isFiltering.value && !selectedTagsIdsSet.value.size
    ? 'No tags results'
    : 'No tags selected'
})

const noLastUsedTagsText = eagerComputed(() => {
  return isFiltering.value
    ? 'No tags results'
    : 'No last used tags'
})

const noUnselectedTagsText = eagerComputed(() => {
  return isFiltering.value
    ? 'No tags results'
    : ''
})

defineExpose({
  selectRandom,
})
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
        :tags="selectedTagsMap"
        :focused="focused.section === SELECTED_FOCUSED_SECTION_NAME ? focused : undefined"
        :edit-mode="!!selectedTagsMap.size && props.editMode"
        :filtered-tags-results="filteredTagsResultsMap"
        closable-tags
        @clickTag="onTagClick"
        @closeTag="onTagClick"
        @addTag="showAddTagModal"
        @editTag="showEditTagModal"
      >
        <template #noTags>
          {{ noSelectedTagsText }}
        </template>
      </TagsList>
    </div>

    <v-divider class="separator" />

    <div class="actions-bar">
      <div class="filter-form input-action">
        <v-text-field
          ref="filterTextCmp"
          v-model="filters.text"
          label="Filter tags"
          prepend-icon="mdi-magnify"
          clearable
          autofocus
          hide-details
          color="primary"
          variant="underlined"
          @focus="onFilterTextFocus"
          @blur="onFilterTextBlur"
          @click:prepend="setFilterTextFocus"
        />
      </div>

      <div class="sort-by-field input-action">
        <v-select
          ref="sortByField"
          v-model="sorts.field"
          :items="SORTS_SELECT_OPTS.fieldItems"
          color="primary"
          label="Sort By"
          hide-details
          prepend-icon="mdi-sort"
          variant="underlined"
        />
      </div>

      <div class="sort-direction input-action">
        <v-select
          ref="sortDirection"
          v-model="sorts.direction"
          :items="SORTS_SELECT_OPTS.directionItems"
          label="Sort Direction"
          hide-details
          color="primary"
          prepend-icon="mdi-sort-alphabetical-variant"
          variant="underlined"
        />
      </div>
    </div>

    <!-- TODO: Feature: on filtering latest used tags, do not hide it but set opacity. -->

    <div class="categories-list">
      <CategoriesList
        :categories="categoriesMap"
        :selected="filters.categories"
        :nb-tags="nbTagsPerCategoryMap"
        :filtered-categories-results="filteredCategoriesResultsMap"
        :edit-mode="props.editMode"
        @select="onSelectCategory"
        @unselect="onUnselectCategory"
        @addCategory="showAddCategoryModal"
        @editCategory="showEditCategoryModal"
      />
    </div>

    <v-divider class="separator" />

    <div
      class="last-used-tags"
      :class="[{
          shake: shake.get(LAST_USED_FOCUSED_SECTION_NAME),
      }]"
    >
      <TagsList
        :tags="lastUsedTagsMap"
        :focused="focused.section === LAST_USED_FOCUSED_SECTION_NAME ? focused : undefined"
        :filtered-tags-results="filteredLastUsedTagsResultsMap"
        :edit-mode="false"
        no-wrap
        @clickTag="onTagClick"
        @addTag="showAddTagModal"
        @editTag="showEditTagModal"
      >
        <template #noTags>
          {{ noLastUsedTagsText }}
        </template>
      </TagsList>
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
        :tags="unselectedTagsMap"
        :focused="focused.section === UNSELECTED_FOCUSED_SECTION_NAME ? focused : undefined"
        :filtered-tags-results="filteredTagsResultsMap"
        :edit-mode="!!unselectedTagsMap.size && props.editMode"
        @clickTag="onTagClick"
        @addTag="showAddTagModal"
        @editTag="showEditTagModal"
        >
        <template #noTags>
          {{ noUnselectedTagsText }}
        </template>
      </TagsList>
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
      width: 200px;
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
.last-used-tags {
  // height: 40px;
  // overflow-y: hidden;
  // overflow-x: auto;
  // white-space: nowrap;
}
.loading {
  position: absolute;
  height: 100vh;
  width: 100vw;
  background: #000000AA;
  z-index: 1000;
}
</style>
