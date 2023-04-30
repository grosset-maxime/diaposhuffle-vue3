<script setup lang="ts">
// TODO: Enh: display beautifull scroll when a lot of tags (instead of the native scroll bar)

// Types
import { createTag, type Tag, type TagId } from '@/models/tag'

// Vendors Libs
import { ref, computed } from 'vue'

import { useTaggerStore } from '@/stores/tagger'
import { eagerComputed } from '@vueuse/shared'

// Props
interface Props {
  tagsIds?: Set<TagId>;
}
const props = withDefaults(defineProps<Props>(), {
  tagsIds: (): Set<TagId> => new Set(),
})

// Emits
const emit = defineEmits<{
  (e: 'click'): void;
}>()

const taggerStore = useTaggerStore()

// Refs
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

// Computeds
const hasTags = eagerComputed(() => !!props.tagsIds.size)

const tagsMap = taggerStore.tags

const tags = computed(() => {
  return Array.from(props.tagsIds)
    .map(
      (tagId) => tagsMap.value.get(tagId) || createTag({
        id: '-1',
        name: tagId,
        categoryId: '-1',
      }),
    )
    .sort((tagA: Tag, tagB: Tag) => {
      let sort = 0
      const direction = sorts.value.direction === 'asc'
        ? 1
        : -1
      const field = sorts.value.field || 'name'

      if (field === 'name') {
        sort = tagA.name.localeCompare(tagB.name)
      }
      else if (field === 'category') {
        sort = tagA.categoryId.localeCompare(tagB.categoryId)
        // sort = tagA.categoryId - tagB.categoryId;
      }

      return direction * sort
    })
})

function getTagStyles (tag?: Tag) {
  const hasCategory = !!tag?.hasCategory()

  return {
    'border-color': getTagCategoryColor(tag),
    'border-style': !hasCategory
      ? 'dashed'
      : 'solid',
  }
}

function getTagCategoryColor (tag?: Tag) {
  const DEFAULT_COLOR = '#FFF'

  return tag && tag.category
    ? tag.category.hashColor || DEFAULT_COLOR
    : DEFAULT_COLOR
}
</script>

<template>
  <div
    class="tags-list"
    :class="[{
      'no-tags': !hasTags,
    }]"
    @click="emit('click')"
  >
    <template v-if="hasTags">
      <div v-for="tag, index in tags" :key="index" class="tag" :style="getTagStyles(tag)">
        {{ tag.name }}
      </div>
    </template>

    <div v-if="!hasTags">No tags</div>
  </div>
</template>

<style lang="scss" scoped>
.tags-list {
  max-height: calc(100vh - 160px);
  overflow: auto;
  background-color: #{$grey-7 + 'DA'};
  font-size: small;
  padding: 5px;
  border-radius: 5px;

  &.no-tags {
    border: 2px solid red;
  }

  .tag {
    border-width: 0;
    border-left: 3px solid #333;
    padding: 5px;
    margin: 8px 4px;
  }
}
</style>
