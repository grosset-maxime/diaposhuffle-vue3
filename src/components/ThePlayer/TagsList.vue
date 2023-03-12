<script setup lang="ts">
// TODO: Enh: display beautifull scroll when a lot of tags (instead of the native scroll bar)

// Types
import type { Tag, TagId } from '@/models/tag';

// Vendors Libs
import { ref, computed } from 'vue';

import { useTaggerStore } from '@/stores/tagger';

// Props
interface Props {
  tagsIds?: Array<TagId>;
}
const props = withDefaults(defineProps<Props>(), {
  tagsIds: (): Array<TagId> => [],
});

// Emits
const emit = defineEmits<{
  (e: 'click'): void;
}>();

const taggerStore = useTaggerStore();

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
});

// Computeds
const tagsIdsMap = computed(() => {
  return Object.fromEntries(props.tagsIds.map((id) => [id, true]));
});
const tagsMap = computed(() => {
  return taggerStore.getTags();
});
const tagsList = computed(() => {
  return taggerStore.getTagsList();
});
const tags = computed(() => {
  return tagsList.value
    .filter((tag: Tag) => tagsIdsMap.value[tag.id])
    .sort((tagA: Tag, tagB: Tag) => {
      let sort = 0;
      const direction = sorts.value.direction === 'asc' ? 1 : -1;
      const field = sorts.value.field || 'name';

      if (field === 'name') {
        sort = tagA.name.localeCompare(tagB.name);
      }
      if (field === 'category') {
        sort = tagA.categoryId.localeCompare(tagB.categoryId);
        // sort = tagA.categoryId - tagB.categoryId;
      }

      return direction * sort;
    });
});
const hasTags = computed(() => tags.value.length);

function getTagStyles(tagId: TagId) {
  const hasCategory = !!tagsMap.value.get(tagId)?.hasCategory();

  return {
    'border-color': getTagCategoryColor(tagId),
    'border-style': !hasCategory ? 'dashed' : 'solid',
  };
}

function getTagCategoryColor(tagId: TagId) {
  const DEFAULT_COLOR = 'FFF';
  const computeColor = (color: string) => `#${color || 'FFF'}`;

  const tag = tagsMap.value.get(tagId);
  if (!tag) {
    return computeColor(DEFAULT_COLOR);
  }

  return computeColor(taggerStore.getCategoryColor(tag.categoryId) || DEFAULT_COLOR);
}
</script>

<template>
  <div
    :class="[
      'tags-list',
      {
        'no-tags': !hasTags,
      },
    ]"
    @click="emit('click')"
  >
    <template v-if="hasTags">
      <div v-for="tag in tags" :key="tag.id" class="tag" :style="getTagStyles(tag.id)">
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
