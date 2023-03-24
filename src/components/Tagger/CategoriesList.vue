<script setup lang="ts">
// Types
import type { TagCategoryId, TagCategory } from '@/models/tag'
import type { FilteredCategoryResult } from '@/logic/TheTagger/theTagger'

import CategoryChip from './CategoryChip.vue'

// Props
interface Props {
  categories: Map<TagCategoryId, TagCategory>
  filteredCategoriesResults: Map<TagCategoryId, FilteredCategoryResult>
  selected?: Set<TagCategoryId>;
  nbTags?: Map<TagCategoryId, number>;
  editMode: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  selected: (): Set<TagCategoryId> => new Set(),
  nbTags: (): Map<TagCategoryId, number> => new Map(),
  editMode: false,
})

// Emits
const emit = defineEmits<{
  (e: 'select', id: TagCategoryId): void;
  (e: 'unselect', id: TagCategoryId): void;
  (e: 'addCategory'): void;
  (e: 'editCategory', id: TagCategoryId): void;
}>()

function onCategoryClick (catId: TagCategoryId) {
  if (props.selected.has(catId)) {
    emit('unselect', catId)
  } else {
    emit('select', catId)
  }
}

function shouldMask (catId: TagCategoryId) {
  let mask = false
  if (props.filteredCategoriesResults.size) {
    mask = (props.filteredCategoriesResults.get(catId)?.score ?? 1) >= 1
  }
  return mask
}
</script>

<template>
  <div
    :class="[
      'categories-list',
      {
        'edit-mode': editMode,
      },
    ]"
  >
    <v-btn
      v-if="editMode"
      class="add-category-btn"
      icon
      outlined
      tile
      left
      color="orange"
      @click="emit('addCategory')"
    >
      <v-icon> mdi-plus </v-icon>
    </v-btn>

    <CategoryChip
      v-for="[catId] in categories"
      :key="`cat-${catId}`"
      :category-id="catId"
      :selected="selected.has(catId)"
      :nb-tags="nbTags.get(catId)"
      :masked="shouldMask(catId)"
      :edit="editMode"
      @click="onCategoryClick"
      @click:edit="emit('editCategory', catId)"
    />
  </div>
</template>

<style lang="scss" scoped>
.categories-list {
  display: flex;
  flex-wrap: wrap;

  .add-category-btn {
    width: $category-height;
    height: $category-height;
    margin: $category-margin;
  }
}
</style>
