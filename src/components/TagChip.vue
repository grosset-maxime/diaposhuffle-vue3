<script setup lang="ts">
// Types
import { createTag, TagCategory, type Tag, type TagId } from '@/models/tag'

// Vendors Libs
import { computed } from 'vue'
import { eagerComputed } from '@vueuse/shared'

// Stores
import { useTheTaggerStore } from '@/stores/TheTaggerStore'

const theTaggerStore = useTheTaggerStore()

// Props
interface Props {
  tagId: TagId;
  focused?: boolean;
  masked?: boolean;
  clickable?: boolean;
  close?: boolean;
  edit?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  focused: false,
  masked: false,
  clickable: false,
  close: false,
  edit: false,
})

// Emits
const emit = defineEmits<{
  (e: 'click', tagId: TagId): void;
  (e: 'click:close', tagId: TagId): void;
  (e: 'click:edit', tagId: TagId): void;
}>()

const tag = computed<Tag>(
  () => theTaggerStore.getTag(props.tagId) || createTag({ id: props.tagId }),
)
const tagName = computed<string>(() => tag.value.name || tag.value.id)
const category = computed<TagCategory | undefined>(() => tag.value.category)

const isNoneCategory = computed<boolean>(
  () => !!category.value?.isNone() || !category.value,
)

const categoryColor = computed<string>(() => category.value?.hashColor || '')

const tagColor = eagerComputed<string>(() => {
  let color: string | undefined

  if (!isNoneCategory.value) {
    color = props.focused
      ? `${categoryColor.value}FF`
      : `${categoryColor.value}FF`
  } else {
    color = '#FFFFFF'
  }

  return color
})

const tagBgColor = eagerComputed<string | undefined>(() => {
  let color: string | undefined

  if (!isNoneCategory.value) {
    color = props.focused
      ? `${categoryColor.value}AA`
      : `${categoryColor.value}20`
  } else if (props.focused) {
    color = '#FFFFFF80'
  }

  return color
})

const tagBoxShadow = eagerComputed<string | undefined>(() => {
  let boxShadow: string | undefined

  if (props.focused) {
    if (!isNoneCategory.value) {
      boxShadow = `0 0 7px 0 ${tagColor.value}`
    } else {
      boxShadow = '0 0 7px 0 #FFFFFF'
    }
  }

  return boxShadow
})
</script>

<template>
  <div
    class="tag-chip"
    :class="[
      'tag',
      {
        clickable,
        focused,
        'is-none-category': isNoneCategory,
        masked,
      },
    ]"
    :style="{
      'background-color': tagBgColor,
      'border-color': tagColor,
      'box-shadow': tagBoxShadow,
    }"
    @click="emit('click', tagId)"
  >
    <span class="tag-content">
      <span class="name">{{ tagName }}</span>

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
          @click.stop="emit('click:edit', tagId)"
        >
          mdi-pencil
        </v-icon>
      </v-btn>

      <v-btn
        v-if="close"
        class="close-btn"
        size="small"
        density="compact"
        color="secondary"
        icon
      >
        <v-icon
        class="close-icon"
          @click.stop="emit('click:close', tagId)"
        >
          mdi-close-circle
        </v-icon>
      </v-btn>
    </span>
  </div>
</template>

<style lang="scss" scoped>
.tag-chip {
  position: relative;
  display: inline-flex;
  height: $tag-height;
  border-radius: 16px;
  border: 1px solid #ffffff;
  padding: 0 12px;
  margin: $tag-margin;
  user-select: none;
  opacity: 0.9;

  .tag-content {
    height: 100%;
    display: inline-flex;
    align-items: center;

    .close-btn,
    .edit-btn {
      margin-left: 6px;
      margin-right: -4px;
    }

    .close-btn {
      .close-icon:hover {
        opacity: 0.72;
      }
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

  &.is-none-category {
    border-style: dashed;
  }

  &.focused {
    border-radius: 4px;
    text-shadow: 0 0 1px #ffffff;
    opacity: 1;
  }

  &.masked {
    opacity: 0.3;
  }
}
</style>
