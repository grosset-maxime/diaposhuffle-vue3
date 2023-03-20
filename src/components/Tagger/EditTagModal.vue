<script setup lang="ts">
// Types
import type { TagId, TagData, TagCategory } from '@/models/tag'

// Vendors Libs
import { ref, computed, watch, onMounted } from 'vue'

import { useKeyboardShortcutsListener } from '@/composables/keyboardShortcutsListener'

// Components
import DeleteModal from '../DeleteModal.vue'
import CircularLoading from '../CircularLoading.vue'

// Stores
import { useTaggerStore } from '@/stores/tagger'

const EMPTY_TAG_DATA: TagData = {
  id: '',
  name: '',
  categoryId: '',
}

const taggerStore = useTaggerStore()
const { startListener, stopListener } = useKeyboardShortcutsListener(keyboardShortcuts)

// Props
interface Props {
  show?: boolean;
  tagId?: TagId;
  add?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  show: false,
  tagId: undefined,
  add: false,
})

// Emits
const emit = defineEmits<{
  (e: 'confirm', tag: TagData): void;
  (e: 'cancel'): void;
  (e: 'delete', id: TagId): void;
}>()

// Refs
const tagData = ref<TagData>({ ...EMPTY_TAG_DATA })
const nameWarningMsg = ref('')
const rules = ref({
  required: (value: string) => !!value || 'Required.',
})
const isFormValid = ref(false)
const showDeleteModal = ref(false)
const loading = ref(false)

// TODO
const formCmp = ref<{
  reset: Function;
  resetValidation: Function;
  validate: Function;
} | null>(null)

// Computeds
const tagModel = computed(
  () => props.tagId
    ? taggerStore.getTag(props.tagId)
    : undefined,
)
const titleModal = computed(() => (props.add
  ? 'Add new tag'
  : 'Edit tag'))

const confirmBtnText = computed(() => (props.add
  ? 'Add'
  : 'Edit'))

const tagsList = taggerStore.tagsList
const categoriesList = taggerStore.categoriesList

const modelName = computed(() => tagData.value?.name || '')

// Methods
// TODO
function getCategoryColor (category: TagCategory) {
  return `#${category.color}`
}

function setModel () {
  resetForm()

  tagData.value = tagModel.value
    ? tagModel.value.getData()
    : { ...EMPTY_TAG_DATA }
}

function resetForm () {
  // TODO
  // formCmp.value?.reset()
}

function resetFormValidation () {
  // TODO
  // formCmp.value?.resetValidation()
}

function isIdNotExists (value: TagId) {
  return (
    !value
    || !props.add
    || !tagsList.value.some((tag) => tag.id.toLowerCase() === value.trim().toLowerCase())
    || 'Id already exists.'
  )
}

function isNameExists (value: string = '') {
  return tagsList.value.some(
    (tag) => tag.id !== tagData.value.id
      && tag.name.toLowerCase() === value.trim().toLowerCase(),
  )
}

function onConfirm () {
  // TODO
  // const isFormValid = formCmp.value?.validate()

  if (isFormValid.value) {
    loading.value = true
    emit('confirm', { ...tagData.value })
  }
}

function onCancel () {
  emit('cancel')
}

function onDelete () {
  loading.value = true
  props.tagId && emit('delete', props.tagId)
  onCancel()
}

function onDeleteBtnClick () {
  showDeleteModal.value = true
}

function closeConfirmDelete ({ deleteTag }: { deleteTag?: boolean } = {}) {
  showDeleteModal.value = false

  if (deleteTag) {
    onDelete()
  }
}

function keyboardShortcuts (key: string, e: KeyboardEvent) {
  let preventDefault = false
  const stopPropagation = false

  if (e.altKey) {
    switch (key) {
    // On windows, Meta + Enter does not trigger a keydown event,
    // So, set Alt + Enter to validate.
    case 'Enter':
      onConfirm()
      preventDefault = true
      break

    default:
    }
  } else if (e.metaKey) {
    // On windows, Alt + Escape does not trigger a keydown event,
    // So, set Meta + Escape to cancel.
    switch (key) {
    case 'Escape':
      onCancel()
      preventDefault = true
      break

    default:
    }
  }

  if (preventDefault) {
    e.preventDefault()
  }
  if (stopPropagation) {
    e.stopPropagation()
  }
}

// Watchers
watch(
  () => props.show,
  (isShow) => {
    if (isShow) {
      loading.value = false
      startListener()

      if (props.add) {
        resetForm()
      } else {
        resetFormValidation()
      }
    } else {
      stopListener()
    }
  },
)

watch(modelName, (name) => {
  nameWarningMsg.value = name?.trim() && isNameExists(name)
    ? 'Name already exists.'
    : ''
})

watch(showDeleteModal, (shouldShow) => {
  if (shouldShow) {
    stopListener()
  } else {
    startListener()
  }
})

onMounted(() => {
  loading.value = false
  setModel()
})
</script>

<template>
  <v-dialog content-class="edit-tag-modal" :value="show" persistent no-click-animation>
    <v-card outlined>
      <v-card-title class="orange--text">
        {{ titleModal }}
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-form v-model="isFormValid" ref="formCmp">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  :value="tagData.id"
                  :disabled="!add"
                  :autofocus="add"
                  :rules="[rules.required, isIdNotExists]"
                  label="Id"
                  required
                  @input="tagData.id = $event"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  :value="tagData.name"
                  :autofocus="!add"
                  :rules="[rules.required]"
                  :hint="nameWarningMsg"
                  label="Name"
                  required
                  @input="tagData.name = $event"
                />
              </v-col>

              <v-col cols="12">
                <v-autocomplete
                  :value="tagData.categoryId"
                  :items="categoriesList"
                  item-text="name"
                  item-value="id"
                  label="Category"
                  chips
                  deletable-chips
                  hide-selected
                  @input="tagData.categoryId = $event"
                >
                  <template v-slot:selection="data">
                    <v-chip
                      v-bind="data.attrs"
                      :color="getCategoryColor(data.item)"
                      text-color="white"
                      close
                      outlined
                      @click:close="tagData.categoryId = ''"
                    >
                      <v-avatar left :color="getCategoryColor(data.item)" />
                      {{ data.item.name }}
                    </v-chip>
                  </template>

                  <template v-slot:item="data">
                    <v-list-item-avatar :color="getCategoryColor(data.item)" size="30" />
                    <v-list-item-content>
                      <!-- TODO: why v-html ?? -->
                      <!-- <v-list-item-title v-html="data.item.name" /> -->
                    </v-list-item-content>
                  </template>
                </v-autocomplete>
              </v-col>
            </v-row>
          </v-form>
        </v-container>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn v-if="!add" class="modal-btn" tabindex="-1" @click="onDeleteBtnClick">
          Delete
        </v-btn>

        <v-btn class="modal-btn" tabindex="-1" @click="onCancel"> Cancel </v-btn>

        <v-btn class="modal-btn primary" :disabled="!isFormValid" tabindex="0" @click="onConfirm">
          {{ confirmBtnText }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <CircularLoading class="loading" v-if="loading" indeterminate />

    <DeleteModal
      v-if="!add"
      :show="showDeleteModal"
      @confirm="closeConfirmDelete({ deleteTag: true })"
      @cancel="closeConfirmDelete"
      @click:outside="closeConfirmDelete"
    >
      <template v-slot:message> Delete this tag? </template>
    </DeleteModal>
  </v-dialog>
</template>

<style lang="scss">
/* FYI: As Vuetify v-dialog is injected at root in DOM, style cannot be scoped. */

.edit-tag-modal {
  .loading {
    position: absolute;
    top: 0;
    left: 0;
    background-color: #{$grey-8 + '80'};
    z-index: 100;
  }
}
</style>
