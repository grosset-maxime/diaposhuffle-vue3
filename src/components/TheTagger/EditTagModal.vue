<script setup lang="ts">
// Types
import type { Tag, TagId, TagData } from '@/models/tag'

// Vendors Libs
import { ref, computed, watch } from 'vue'

import { useKeyboardShortcutsListener } from '@/logic/useKeyboardShortcutsListener'

// Components
import DeleteModal from '../DeleteModal.vue'
import CircularLoading from '../CircularLoading.vue'

// Stores
import { useTheTaggerStore } from '@/stores/TheTaggerStore'
import type { VAutocomplete, VForm } from 'vuetify/lib/components/index.mjs'
import { createCustomError, type CustomError, type CustomErrorData } from '@/models/customError'
import { logError } from '@/utils/errorUtils'
import { createAlert } from '@/utils/alertUtils'
import { useAlertStore } from '@/stores/alertStore'

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

const EMPTY_TAG_DATA: TagData = {
  id: '',
  name: '',
  categoryId: '0',
}

const theTaggerStore = useTheTaggerStore()
const { startKSListener, stopKSListener } = useKeyboardShortcutsListener(keyboardShortcuts)
const alertStore = useAlertStore()

// Refs
const tagData = ref<TagData>({ ...EMPTY_TAG_DATA })
const isFormValid = ref(false)
const showDeleteModal = ref(false)
const loading = ref(false)

const formCmp = ref<InstanceType<typeof VForm> | null>(null)
const categorySelectCmp = ref<InstanceType<typeof VAutocomplete> | null>(null)

// Computeds
const tagModel = computed(
  () => props.tagId
    ? theTaggerStore.getTag(props.tagId)
    : undefined,
)
const titleModal = computed(() => (props.add
  ? 'Add new tag'
  : 'Edit tag'))

const confirmBtnText = computed(() => (props.add
  ? 'Add'
  : 'Edit'))

const tagsList = theTaggerStore.tagsList
const categoriesList = theTaggerStore.categoriesList

const categoriesListSelect = computed(() => categoriesList.value.map((cat) => ({
  value: cat.id,
  title: cat.name,
  disabled: false,
  color: cat.hashColor,
})))

const tagDataCategoryColor = computed(
  () => theTaggerStore.getCategory(tagData.value?.categoryId || '0')?.hashColor,
)

//#region Methods
function onError (error: unknown, errorData?: CustomErrorData): CustomError {
  const customError = createCustomError(error, {
    ...errorData,
    file: 'TheTagger/EditTagModal.vue',
  })
  logError(customError)

  alertStore.add(createAlert({ error: customError }))

  return customError
}

function resetForm () {
  formCmp.value?.reset()
}

const rules = {
  required: (value: string) => !!value || 'Required.',
  isIdNotExists: (value: TagId) => (
    !value
    || !props.add
    || !tagsList.value.some((tag) => tag.id.toLowerCase() === value.trim().toLowerCase())
    || 'Id already exists.'
  ),
  isNameNotExists: (value: string = '') => (
    tagsList.value.some(
      (tag) => tag.id !== tagData.value.id
        && tag.name.toLowerCase() === value.trim().toLowerCase(),
    )
      ? 'Name already exists.'
      : true
  ),
}

async function onConfirm () {
  if (!formCmp.value) { return }

  loading.value = true

  try {
    const { valid } = await formCmp.value.validate()

    if (valid) {
      emit('confirm', { ...tagData.value })
    } else {
      loading.value = false
    }
  } catch(e) {
    loading.value = false
    onError(e, { actionName: 'onConfirm' })
  }
}

function onCancel () {
  emit('cancel')
}

function onDeleteBtnClick () {
  showDeleteModal.value = true
}

function closeConfirmDelete ({ deleteTag }: { deleteTag?: boolean } = {}) {
  showDeleteModal.value = false

  if (deleteTag) {
    loading.value = true
    props.tagId && emit('delete', props.tagId)
  }
}

function focusCategorySelect () {
  if (categorySelectCmp.value) {
    categorySelectCmp.value.menu = true
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
//#endregion Methods

// Watchers
watch(
  () => props.show,
  (isShow) => {
    if (isShow) {
      loading.value = false

      if (props.add) {
        tagData.value = { ...EMPTY_TAG_DATA }
      }

      startKSListener()
    } else {
      stopKSListener()
    }
  },
)

watch(tagModel, (tag?: Tag) => {
  resetForm()

  tagData.value = tag
    ? tag.getData()
    : { ...EMPTY_TAG_DATA }
})

watch(showDeleteModal, (shouldShow) => {
  if (shouldShow) {
    stopKSListener()
  } else {
    startKSListener()
  }
})
</script>

<template>
  <v-dialog
    content-class="edit-tag-modal"
    :model-value="show"
    persistent
    no-click-animation
  >
    <v-card outlined>
      <v-card-title class="text-primary">
        {{ titleModal }}
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-form v-model="isFormValid" ref="formCmp">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="tagData.id"
                  :disabled="!add"
                  :autofocus="add"
                  :rules="add ? [rules.required, rules.isIdNotExists] : undefined"
                  label="Id"
                  required
                  variant="underlined"
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="tagData.name"
                  :autofocus="!add"
                  :rules="[rules.required, rules.isNameNotExists]"
                  label="Name"
                  required
                  variant="underlined"
                />
              </v-col>

              <v-col cols="12">
                <v-autocomplete
                  ref="categorySelectCmp"
                  v-model="tagData.categoryId"
                  :items="categoriesListSelect"
                  label="Category"
                  hide-selected
                  variant="underlined"
                  @update:model-value="formCmp!.validate()"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-avatar :color="item.raw.color" size="30"/>
                      </template>
                    </v-list-item>
                  </template>

                  <template v-slot:prepend v-if="tagDataCategoryColor">
                    <v-avatar :color="tagDataCategoryColor" @click="focusCategorySelect"/>
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

        <v-btn class="modal-btn" tabindex="-1" @click="onCancel">Cancel</v-btn>

        <v-btn
          class="modal-btn"
          :disabled="!isFormValid"
          @click="onConfirm"
          color="primary"
          tabindex="0"
        >
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
      <template v-slot:message>Delete this tag?</template>
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
