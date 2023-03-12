<script setup lang="ts">
// Types
import type { TagId } from '@/models/tag';

// Vendors Libs
import { computed } from 'vue';

// Components
import TagChip from '../TagChip.vue';

// Props
interface Props {
  tagIds?: Array<TagId>;
  focused?: {
    id?: TagId | undefined;
  }; // TODO
  masked?: Map<TagId, boolean>; // TODO
  closableTags?: boolean;
  noTagsText?: string;
  editMode?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  tagIds: (): Array<TagId> => [],
  focused: () => ({
    id: undefined,
  }),
  masked: () => new Map(),
  closableTags: false,
  noTagsText: 'No tags',
  editMode: false,
});

// Emits
const emit = defineEmits<{
  (e: 'clickTag', tagId: TagId): void;
  (e: 'closeTag', tagId: TagId): void;
  (e: 'editTag', tagId: TagId): void;
  (e: 'addTag'): void;
}>();

const hasTags = computed(() => {
  return (props.tagIds?.length || 0) > 0;
});
</script>

<template>
  <div
    :class="[
      'tags-list',
      {
        'edit-mode': editMode,
      },
    ]"
  >
    <v-btn
      v-if="editMode"
      class="add-tag-btn"
      icon
      outlined
      left
      color="orange"
      @click="emit('addTag')"
    >
      <v-icon> mdi-plus </v-icon>
    </v-btn>

    <TagChip
      v-for="tagId in tagIds"
      :key="`tag-${tagId}`"
      :tag-id="tagId"
      :focused="focused.id === tagId"
      :masked="!!masked.get(tagId)"
      :edit="editMode"
      :close="closableTags"
      clickable
      @click="emit('clickTag', tagId)"
      @click:close="emit('closeTag', tagId)"
      @click:edit="emit('editTag', tagId)"
    />

    <div v-if="!hasTags" class="no-tags">
      {{ noTagsText }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tags-list {
  display: flex;
  flex-wrap: wrap;
  height: 100%;

  .add-tag-btn {
    width: $tag-height;
    height: $tag-height;
    margin: $tag-margin;
    z-index: 2;
  }

  .no-tags {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $grey-6;
    width: 100%;
    z-index: 1;
  }
}
</style>
