<script setup lang="ts">
// Types
import type { TagCategoryId } from '@/models/tag'

import CategoryChip from './CategoryChip.vue'

// Props
interface Props {
  categoryIds?: Array<TagCategoryId>;
  selected?: Set<TagCategoryId>;
  nbTags?: Map<TagCategoryId, number>;
  masked?: Map<TagCategoryId, boolean>;
  editMode: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  categoryIds: (): Array<TagCategoryId> => [],
  selected: (): Set<TagCategoryId> => new Set(),
  nbTags: (): Map<TagCategoryId, number> => new Map(),
  masked: (): Map<TagCategoryId, boolean> => new Map(),
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
      v-for="catId in categoryIds"
      :key="`cat-${catId}`"
      :category-id="catId"
      :selected="selected.has(catId)"
      :nb-tags="nbTags.get(catId)"
      :masked="!!masked.get(catId)"
      :edit="editMode"
      @click="onCategoryClick"
      @click:edit="emit('editCategory', catId)"
    />

    <CategoryChip
      key="cat-0"
      category-id="0"
      :selected="selected.has('0')"
      :nb-tags="nbTags.get('0')"
      :masked="!!masked.get('0')"
      @click="onCategoryClick"
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
