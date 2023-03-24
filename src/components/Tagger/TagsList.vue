<script setup lang="ts">
// Types
import type { TagId, Tag } from '@/models/tag'
import type { FilteredTagResult } from '@/logic/TheTagger/theTagger'

// Vendors Libs
import { eagerComputed } from '@vueuse/shared'

// Components
import TagChip from '../TagChip.vue'

// Props
interface Props {
  tags: Map<TagId, Tag>
  filteredTagsResults: Map<TagId, FilteredTagResult>
  focused?: {
    id?: TagId | undefined
  }; // TODO
  closableTags?: boolean
  editMode?: boolean
  noWrap?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  focused: () => ({
    id: undefined,
  }),
  closableTags: false,
  editMode: false,
  noWrap: false,
})

// Emits
const emit = defineEmits<{
  (e: 'clickTag', tagId: TagId): void;
  (e: 'closeTag', tagId: TagId): void;
  (e: 'editTag', tagId: TagId): void;
  (e: 'addTag'): void;
}>()

const hasTags = eagerComputed(() => {
  return props.tags.size > 0
})

function shouldMask (tagId: TagId) {
  let mask = false
  if (props.filteredTagsResults.size) {
    mask = (props.filteredTagsResults.get(tagId)?.score ?? 1) >= 1
  }
  return mask
}
</script>

<template>
  <div
    :class="[
      'tags-list',
      {
        'edit-mode': editMode,
        'no-wrap': noWrap
      },
    ]"
  >
    <v-btn
      v-if="editMode"
      class="add-tag-btn"
      icon
      outlined
      left
      color="primary"
      @click="emit('addTag')"
    >
      <v-icon> mdi-plus </v-icon>
    </v-btn>

    <TagChip
      v-for="[tagId] in tags"
      :key="`tag-${tagId}`"
      :tag-id="tagId"
      :focused="focused.id === tagId"
      :masked="shouldMask(tagId)"
      :edit="editMode"
      :close="closableTags"
      clickable
      @click="emit('clickTag', tagId)"
      @click:close="emit('closeTag', tagId)"
      @click:edit="emit('editTag', tagId)"
    />

    <div v-if="!hasTags" class="no-tags">
      <slot name="noTags">
        No tags
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tags-list {
  display: flex;
  flex-wrap: wrap;
  height: 100%;

  &.no-wrap {
    display: block;
    white-space: nowrap;
    @include w-scrollbar(none, auto);
  }

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
