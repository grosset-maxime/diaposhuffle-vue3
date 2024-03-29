<script setup lang="ts">
// Types
import type { TagId } from '@/models/tag'

// Vendors Libs
import { ref, watch } from 'vue'

// Components
import TaggerView from '@/components/TheTagger/TaggerView.vue'
import useReactiveSet from '@/logic/useReactiveSet'

// Props
interface Props {
  show?: boolean;
  selected: Set<TagId>;
}
const props = withDefaults(defineProps<Props>(), {
  show: false,
})

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', tagIds: Set<TagId>): void;
}>()

// Refs
const selectedTagId = useReactiveSet<TagId>()

const editMode = ref(false)
const hasOpacity = ref(false)
const theTaggerCmp = ref<InstanceType<typeof TaggerView> | null>(null)
const showTheTagger = ref(false)

//#region Methods
function onShow () {
  editMode.value = false
  hasOpacity.value = false

  selectedTagId.value.addValues(props.selected, { clear: true })
  showTheTagger.value = true
}

function onHide () {
  setTimeout(() => showTheTagger.value = false, 300)
}

function onSave () {
  emit('save', new Set(selectedTagId.value))
  onClose()
}

function onCancel () {
  onClose()
}

function onClose () {
  onHide()
  emit('close')
  selectedTagId.value.clear()
}

function onSelect (tagId: TagId) {
  selectedTagId.value.add(tagId)
}

function onUnselect (tagId: TagId) {
  selectedTagId.value.delete(tagId)
}

function onToggleOpacity () {
  hasOpacity.value = !hasOpacity.value
}

function selectRandom () {
  theTaggerCmp.value?.selectRandom()
}
//#endregion Methods

watch(
  () => props.show,
  (isShow) => {
    isShow
      ? onShow()
      : onHide()
  },
)
</script>

<template>
  <div
    v-if="show"
    class="the-tagger"
    :class="{
      'has-opacity': hasOpacity
    }"
  >
    <v-card style="height: 100%">
      <v-toolbar class="the-tagger-toolbar" density="compact" color="background">
        <v-btn icon @click="onCancel">
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <v-toolbar-title class="title">Tagger</v-toolbar-title>

        <v-tooltip location="right">
          <template v-slot:activator="{ props }">
            <v-btn
              class="edit-btn"
              icon
              small
              v-bind="props"
              @click="editMode = !editMode"
            >
              <v-icon class="edit-icon" density="compact"> mdi-pencil </v-icon>
            </v-btn>
          </template>
          <span>Edit Mode</span>
        </v-tooltip>

        <v-tooltip location="right">
          <template v-slot:activator="{ props }">
            <v-btn
              class="select-random-btn"
              icon
              small
              v-bind="props"
              @click="selectRandom"
            >
              <v-icon class="select-random-icon" density="compact"> mdi-shuffle-variant </v-icon>
            </v-btn>
          </template>
          <span>Select Random</span>
        </v-tooltip>

        <v-spacer />

        <v-toolbar-items>
          <v-btn
            class="cancel-btn"
            variant="text"
            @click="onCancel"
          >
            Cancel
          </v-btn>
          <v-btn variant="text" @click="onSave">Save</v-btn>
        </v-toolbar-items>
      </v-toolbar>

      <TaggerView
        class="tagger-ctn"
        ref="theTaggerCmp"
        :selected="selectedTagId"
        :edit-mode="editMode"
        :show="show"
        @select="onSelect"
        @unselect="onUnselect"
        @cancel="onCancel"
        @save="onSave"
        @toggleOpacity="onToggleOpacity"
      />
    </v-card>
  </div>
</template>

<style lang="scss">
$v-toolbar-height: 48px;

.the-tagger {
  position: fixed;
  height: 100vh;
  width: 100vw;
  top: 0;
  right: 0;
  z-index: 2000;
  overflow-x: hidden;
  overflow-y: hidden;

  &.has-opacity {
    opacity: 0.3;
  }

  .tagger-ctn {
    height: calc(100% - #{$v-toolbar-height});
  }

  .the-tagger-toolbar {
    .cancel-btn,
    .edit-btn,
    .select-random-btn {
      text-transform: none;
      color: $grey-6;
      &:hover {
        color: white;
      }
    }

    .edit-btn .edit-icon {
      font-size: 18px;
    }
  }

  .title {
    max-width: 70px;
  }
}

</style>
