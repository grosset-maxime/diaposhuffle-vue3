<script setup lang="ts">
// Types
import type { Ref } from 'vue';
import type { Folder } from '@/stores/folderBrowser';

// Vendors Libs
import { ref, computed } from 'vue';

// Props
interface Props {
  folder: Ref<Folder>;
  selected?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  selected: false,
});

// Emits
const emit = defineEmits<{
  (e: 'expand', path: string): void;
  (e: 'select', path: string): void;
  (e: 'unselect', path: string): void;
}>();

// Refs
const path = ref(props.folder.value.path);
const isFetching = ref(props.folder.value.fetching);
const name = ref(props.folder.value.name);
const isExpanded = ref(false);
// const isSelected = ref(false);

// Computeds
const hasChildren = computed(() => !!props.folder.value.children.length);

// Methods
function onExpandBtnClick() {
  if (hasChildren.value) {
    isExpanded.value = !isExpanded.value;
    emit('expand', path.value);
  }
}

function onSelectedChange(isSelected: boolean) {
  if (isSelected) {
    emit('select', path.value);
  } else {
    emit('unselect', path.value);
  }
}

function onFolderLineClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    onSelectedChange(!props.selected);
  }
}
</script>

<template>
  <div class="folder-ctn">
    <div class="folder" @click="onFolderLineClick">
      <v-btn
        :class="[
          'expand-btn',
          {
            'no-sub-folders': !hasChildren,
            expanded: isExpanded,
          },
        ]"
        width="24"
        min-width="24"
        height="24"
        color="orange"
        :disabled="!hasChildren"
        @click="onExpandBtnClick"
      >
        <v-progress-circular v-if="isFetching" size="15" width="1" indeterminate />
        <v-icon class="plus-icon" v-show="!isFetching"> mdi-plus </v-icon>
        <v-icon class="minus-icon" v-show="!isFetching"> mdi-minus </v-icon>
      </v-btn>

      <v-checkbox
        :label="name"
        :true-value="true"
        :false-value="false"
        :input-value="selected"
        @change="onSelectedChange"
      />
    </div>
    <div
      :class="[
        'sub-folders-ctn',
        {
          hide: !isExpanded,
        },
      ]"
    >
      <slot name="sub-folders" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$folder-padding-left: 5px;

.folder-ctn {
  cursor: pointer;

  .expand-btn {
    padding: 0 12px;
    margin-right: 10px;

    &.expanded {
      .plus-icon {
        display: none;
      }
      .minus-icon {
        display: block;
      }
    }

    &.no-sub-folders {
      .plus-icon,
      .minus-icon {
        display: none;
      }
    }

    .plus-icon {
      display: block;
    }
    .minus-icon {
      display: none;
    }
  }

  .folder {
    padding-left: $folder-padding-left;
    display: flex;
    align-items: center;
    height: 40px;

    &:hover {
      background-color: $grey-7;
    }

    .name {
      cursor: pointer;
    }
  }

  .sub-folders-ctn {
    padding-left: 12px;
    margin-left: #{12px + $folder-padding-left};
    border-left: 1px dashed $grey-6;

    &.hide {
      display: none;
    }
  }
}
</style>
