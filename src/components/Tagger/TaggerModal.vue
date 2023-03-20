<script setup lang="ts">
// Types
import type { TagId } from '@/models/tag'

// Vendors Libs
import { ref, computed, watch } from 'vue'

// Components
import TheTagger from '@/components/Tagger/TheTagger.vue'

// Props
interface Props {
  show?: boolean;
  selected?: Set<TagId>;
}
const props = withDefaults(defineProps<Props>(), {
  show: false,
  selected: (): Set<TagId> => new Set(),
})

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', tagIds: Set<TagId>): void;
}>()

// Refs
const selected = ref<Set<TagId>>(new Set(props.selected))
const editMode = ref(false)
const hasOpacity = ref(false)
const isTaggerMounted = ref(false)

// const TaggerCmp = ref<{
//   onShow: Function;
//   onHide: Function;
//   selectRandom: Function;
// } | null>(null)

// Computeds
const modalClasses = computed(() => {
  return `tagger-modal ${hasOpacity.value
    ? 'has-opacity'
    : ''}`
})

function onShow () {
  editMode.value = false
  hasOpacity.value = false

  selected.value = new Set(props.selected)

  if (isTaggerMounted.value) {
    // TODO
    // TaggerCmp.value?.onShow()
  }
}

function onHide () {
  // TODO
  // TaggerCmp.value?.onHide()
}

function onSave () {
  emit('save', new Set(selected.value))
  onClose()
}

function onCancel () {
  onClose()
}

function onClose () {
  onHide()
  emit('close')
  selected.value = new Set()
}

function onSelect (tagId: TagId) {
  selected.value.add(tagId)
}

function onUnselect (tagId: TagId) {
  selected.value.delete(tagId)
}

function onUnselectAll () {
  selected.value.clear()
}

function onToggleOpacity () {
  hasOpacity.value = !hasOpacity.value
}

function onTaggerMounted () {
  // TODO
  // TaggerCmp.value?.onShow()
  isTaggerMounted.value = true
}

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
  <v-dialog
    :content-class="modalClasses"
    :model-value="show"
    fullscreen
    transition="dialog-bottom-transition"
    persistent
    no-click-animation
  >
    <v-card style="height: 100%">
      <v-toolbar class="tagger-modal-toolbar" dense>
        <v-btn icon @click="onCancel">
          <v-icon>mdi-close</v-icon>
        </v-btn>

        <v-toolbar-title>Tagger</v-toolbar-title>

        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              class="edit-btn ml-3"
              icon
              small
              v-bind="attrs"
              v-on="on"
              @click="editMode = !editMode"
            >
              <v-icon class="edit-icon" dense> mdi-pencil </v-icon>
            </v-btn>
          </template>
          <span>Edit Mode</span>
        </v-tooltip>

        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              class="select-random-btn ml-3"
              icon
              small
              v-bind="attrs"
              v-on="on"
            >
              <v-icon class="select-random-icon" dense> mdi-shuffle-variant </v-icon>
            </v-btn>
          </template>
          <span>Select Random</span>
        </v-tooltip>

        <v-spacer />

        <v-toolbar-items>
          <v-btn class="cancel-btn" text @click="onCancel"> Cancel </v-btn>
          <v-btn text @click="onSave"> Save </v-btn>
        </v-toolbar-items>
      </v-toolbar>

      <TheTagger
        class="tagger-ctn"
        ref="TaggerCmp"
        :selected="selected"
        :edit-mode="editMode"
        @select="onSelect"
        @unselect="onUnselect"
        @cancel="onCancel"
        @save="onSave"
        @toggleOpacity="onToggleOpacity"
        @mounted="onTaggerMounted"
      />
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped></style>

<style lang="scss">
$v-toolbar-height: 48px;

.tagger-modal {
  overflow-x: hidden;
  overflow-y: hidden;

  &.has-opacity {
    opacity: 0.3;
  }

  .tagger-ctn {
    height: calc(100% - #{$v-toolbar-height});
  }

  .tagger-modal-toolbar {
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
}
</style>
