<script setup lang="ts">
// Types
import type { TagCategoryId } from '@/models/tag'

// Vendors Libs
import { computed } from 'vue'

// Stores
import { useTheTaggerStore } from '@/stores/TheTaggerStore'
import { eagerComputed } from '@vueuse/shared'

const theTaggerStore = useTheTaggerStore()

const DEFAULT_COLOR = '#FFFFFF'

// Props
interface Props {
  categoryId?: TagCategoryId;
  selected?: boolean;
  nbTags?: number;
  masked?: boolean;
  edit?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  categoryId: '',
  selected: false,
  nbTags: undefined,
  masked: false,
  edit: false,
})

// Emits
const emit = defineEmits<{
  (e: 'click', categoryId: TagCategoryId): void;
  (e: 'click:edit', categoryId: TagCategoryId): void;
}>()

// Computeds
const category = computed(() => theTaggerStore.getCategory(props.categoryId))
const isNoneCategory = computed(() => !!category.value?.isNone())
const nbTags = computed(
  () => typeof props.nbTags === 'number'
    ? props.nbTags
    : category.value?.tags.size || 0,
)

const categoryColor = computed(() => category.value?.hashColor || DEFAULT_COLOR)

const chipColor = eagerComputed(() => {
  return props.selected
    ? `${categoryColor.value}FF`
    : `${categoryColor.value}FF`
})

const chipBgColor = eagerComputed(() => {
  return props.selected
    ? `${categoryColor.value}AA`
    : `${categoryColor.value}20`
})

const chipBoxShadow = eagerComputed(() => {
  let boxShadow

  if (props.selected) {
    boxShadow = `0 0 7px 0 ${chipColor.value}`
  }

  return boxShadow
})
</script>

<template>
  <div
    class="category-chip"
    :class="[
      'category',
      {
        selected,
        clickable: true,
        'is-none': isNoneCategory,
        masked,
      },
    ]"
    :style="{
      'background-color': chipBgColor,
      'border-color': chipColor,
      'box-shadow': chipBoxShadow,
    }"
    @click="emit('click', categoryId)"
  >
    <span class="category-content">
      {{ category?.name }}

      <div class="nb-tags">
        {{ nbTags }}
      </div>

      <v-btn
        v-if="edit"
        class="edit-btn"
        size="small"
        density="compact"
        color="secondary"
        icon
      >
        <v-icon
          class="edit-icon"
          @click.stop="emit('click:edit', categoryId)"
        >
          mdi-pencil
        </v-icon>
      </v-btn>
    </span>
  </div>
</template>

<style lang="scss" scoped>
.category-chip {
  position: relative;
  display: inline-flex;
  height: $category-height;
  border-radius: 4px;
  border: 1px solid #ffffff;
  padding: 0 4px;
  margin: $category-margin;
  user-select: none;

  .category-content {
    height: 100%;
    display: inline-flex;
    align-items: center;

    .nb-tags {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: $grey-1;
      color: $grey-8;
      opacity: 0.5;
      border-radius: 50px;
      font-size: x-small;
      font-weight: bold;
      padding: 0 3px;
      margin-left: 4px;
      min-width: 15px;
    }

    .edit-btn {
      margin-left: 4px;
      margin-right: -4px;
    }

    .edit-btn {
      color: $grey-6;

      &:hover {
        color: white;
      }

      .edit-icon {
        font-size: 14px;
      }
    }
  }

  &.clickable {
    cursor: pointer;
  }

  &.is-none {
    border-style: dashed;
  }

  &.selected {
    text-shadow: 0 0 1px #ffffff;
  }

  &.masked {
    opacity: 0.5;
  }
}
</style>
