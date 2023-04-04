<script setup lang="ts">
// TODO: Enh: On tag focus change, scroll to the focused tag.
// TODO: Feature: On up/down keydown, focus above/below tags section.
// TODO: Enh: On up/down left/right keydown set tag focus to right tag.

// TODO: Bug: Error on set tag when items come from the bdd. => Already fixed ??

// Types
import type { TagCategoryId, TagId, TagData, TagCategoryData } from '@/models/tag'
import type { Sort } from '@/logic/TheTagger/theTagger'
import type { TagFocused, ShakeSections } from '@/logic/TheTagger/tagFocus'

// Vendors Libs
import { ref, watch, reactive } from 'vue'
import { eagerComputed, whenever } from '@vueuse/shared'

// Stores
import { useTaggerStore } from '@/stores/tagger'

// Utils
import { getRandomElement, wait } from '@/utils/utils'

import { useKeyboardShortcutsListener } from '@/composables/keyboardShortcutsListener'
import { useTheTagger } from '@/logic/TheTagger/theTagger'

// Components
import CategoriesList from './CategoriesList.vue'
import CircularLoading from '../CircularLoading.vue'
import TagsList from './TagsList.vue'
import EditTagModal from './EditTagModal.vue'
import EditCategoryModal from './EditCategoryModal.vue'
import { useTagFocus, TagsSection } from '@/logic/TheTagger/tagFocus'

const taggerStore = useTaggerStore()
const { startKSListener, stopKSListener } = useKeyboardShortcutsListener(keyboardShortcuts)

// Props
interface Props {
  show: boolean
  selected?: Set<TagId>
  editMode?: boolean
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

const selectedTagsIdsSet = ref<Set<TagId>>(new Set(props.selected))
const isLoading = ref(true)

//#region Filtering section
const filters = reactive<{
  text: string;
  categories: Set<TagCategoryId>;
}>({
  text: '',
  categories: new Set(),
})

const sorts = reactive<Sort>({
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

const hasCategoriesFilter = eagerComputed(() => !!filters.categories.size)

const isFiltering = eagerComputed(
  () => !!(hasCategoriesFilter.value || filters.text),
)

function onSelectCategory (catId: TagCategoryId) {
  filters.categories.add(catId)
}

function onUnselectCategory (catId: TagCategoryId) {
  filters.categories.delete(catId)
}

function onFilterTextFocus () {
  isFilterTextHasFocus.value = true
}

function onFilterTextBlur () {
  isFilterTextHasFocus.value = false
}

function clearFilterText () {
  filters.text = ''
}

async function setFilterTextFocus () {
  filterTextCmp.value?.focus()
}

function resetFilters () {
  filters.text = ''
  filters.categories = new Set()
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

//#region Tag Focus
const tagFocused = reactive<TagFocused>({
  id: undefined,
  pos: 0,
  section: TagsSection.unselected,
})

const shakeSections = reactive<ShakeSections>(new Map())

const {
  setFocusLeft,
  setFocusRight,
  setFocusDown,
  setFocusUp,
  resetFocus,
} = useTagFocus(
  tagFocused,
  shakeSections,
  selectedTagsMap,
  lastUsedTagsMap,
  unselectedTagsMap,
)
//#endregion Tag Focus

//#region Methods
function onTagClick (tagId?: TagId) {
  if (!tagId) { return }

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
  if (tagFocused.pos === unselectedTagsMap.value.size) {
    tagFocused.pos -= 2
  } else {
    tagFocused.pos -= 1
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
      onTagClick(tagFocused.id)
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
      onTagClick(tagFocused.id)
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

//#region Watchers
whenever(() => props.show, async () => {
  await wait()
  setFilterTextFocus()
  updateSelectedTagIdsMap()
})
watch([ filters, sorts ], () => resetFocus(TagsSection.unselected))

// Remove from categories filter the deleted category.
watch(taggerStore.categories, (categories) => {
  if (!hasCategoriesFilter) { return }

  filters.categories.forEach((catId) => {
    if (!categories.has(catId)) {
      filters.categories.delete(catId)
    }
  })
})

whenever(taggerStore.isTaggerReady, (isTaggerReady: boolean) => {
  if (!isTaggerReady) { return }

  startKSListener()
  resetFilters()
  resetFocus(TagsSection.unselected)

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
  stopKSListener()
  editTagModal.value.add = true
  editTagModal.value.tagId = undefined
  editTagModal.value.show = true
}

function showEditTagModal (tagId: TagId) {
  stopKSListener()
  editTagModal.value.add = false
  editTagModal.value.tagId = tagId
  editTagModal.value.show = true
}

function hideEditTagModal () {
  editTagModal.value.show = false
  startKSListener()
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
  stopKSListener()
  editCategoryModal.value.add = true
  editCategoryModal.value.categoryId = undefined
  editCategoryModal.value.show = true
}

function showEditCategoryModal (catId: TagCategoryId) {
  stopKSListener()
  editCategoryModal.value.add = false
  editCategoryModal.value.categoryId = catId
  editCategoryModal.value.show = true
}

function hideEditCategoryModal () {
  editCategoryModal.value.show = false
  startKSListener()
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
          shake: shakeSections.get(TagsSection.selected),
        },
      ]"
    >
      <TagsList
        :tags="selectedTagsMap"
        :focused="tagFocused.section === TagsSection.selected ? tagFocused : undefined"
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
          shake: shakeSections.get(TagsSection.lastUsedTags),
      }]"
    >
      <TagsList
        :tags="lastUsedTagsMap"
        :focused="tagFocused.section === TagsSection.lastUsedTags ? tagFocused : undefined"
        :filtered-tags-results="filteredLastUsedTagsResultsMap"
        :edit-mode="!!lastUsedTagsMap.size && props.editMode"
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
          shake: shakeSections.get(TagsSection.unselected),
        },
      ]"
    >
      <TagsList
        :tags="unselectedTagsMap"
        :focused="tagFocused.section === TagsSection.unselected ? tagFocused : undefined"
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
.loading {
  position: absolute;
  height: 100vh;
  width: 100vw;
  background: #000000AA;
  z-index: 1000;
}
</style>
