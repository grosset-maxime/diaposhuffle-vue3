<script setup lang="ts">
// Types
import type { TagCategoryId, TagCategoryData, TagCategory } from '@/models/tag'

// Vendors Libs
import { ref, computed, watch } from 'vue'
import { VForm } from 'vuetify/lib/components/index.mjs'

import { useKeyboardShortcutsListener } from '@/logic/useKeyboardShortcutsListener'

// Stores
import { useTheTaggerStore } from '@/stores/TheTaggerStore'

// Components
import DeleteModal from '@/components/DeleteModal.vue'
import CircularLoading from '../CircularLoading.vue'
import { createCustomError, type CustomError, type CustomErrorData } from '@/models/customError'
import { logError } from '@/utils/errorUtils'
import { createAlert } from '@/utils/alertUtils'
import { useAlertStore } from '@/stores/alertStore'

// Props
interface Props {
  show?: boolean;
  categoryId?: TagCategoryId;
  add?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  show: false,
  categoryId: undefined,
  add: false,
})

// Emits
const emit = defineEmits<{
  (e: 'confirm', catData: TagCategoryData): void;
  (e: 'cancel'): void;
  (e: 'delete', id: TagCategoryId): void;
}>()

const EMPTY_CATEGORY_DATA: TagCategoryData = {
  id: '',
  name: '',
  color: '',
}

const theTaggerStore = useTheTaggerStore()
const { startKSListener, stopKSListener } = useKeyboardShortcutsListener(keyboardShortcuts)
const alertStore = useAlertStore()

// Refs
const categoryData = ref<TagCategoryData>({ ...EMPTY_CATEGORY_DATA })
const color = ref('')
const colorWarningMsg = ref('')
const isFormValid = ref(false)
const showDeleteModal = ref(false)
const loading = ref(false)

const formCmp = ref<InstanceType<typeof VForm> | null>(null)

// Computeds
const categoryModel = computed(
  () => props.categoryId
    ? theTaggerStore.getCategory(props.categoryId)
    : undefined,
)
const titleModal = computed(() => (props.add
  ? 'Add new category'
  : 'Edit category'))

const confirmBtnText = computed(() => (props.add
  ? 'Add'
  : 'Edit'))

const categoriesList = theTaggerStore.categoriesList

//#region Methods
function onError (error: unknown, errorData?: CustomErrorData): CustomError {
  const customError = createCustomError(error, {
    ...errorData,
    file: 'TheTagger/EditCategoryModal.vue',
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
  isIdNotExists: (value: TagCategoryId) => (
    !value
    || !props.add
    || !categoriesList.value.some((cat) => cat.id.toLowerCase() === value.trim().toLowerCase())
    || 'Id already exists.'
  ),
  isNameNotExists: (value: string = '') => (
    categoriesList.value.some(
      (cat) => cat.id !== categoryData.value.id
        && cat.name.toLowerCase() === value.trim().toLowerCase(),
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
      emit('confirm', { ...categoryData.value })
    } else {
      loading.value = false
    }
  } catch (e) {
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

function closeConfirmDelete ({ deleteCat }: { deleteCat?: boolean } = {}) {
  showDeleteModal.value = false

  if (deleteCat) {
    loading.value = true
    props.categoryId && emit('delete', props.categoryId)
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

watch(() => props.show, (isShow) => {
  if (isShow) {
    loading.value = false

    if (props.add) {
      categoryData.value = { ...EMPTY_CATEGORY_DATA }
      color.value = ''
    }

    startKSListener()
  } else {
    stopKSListener()
  }
})

watch(categoryModel, (category?: TagCategory) => {
  resetForm()

  categoryData.value = category
    ? category.getData()
    : { ...EMPTY_CATEGORY_DATA }

  color.value = category
    ? category.hashColor
    : ''
})

watch(color, (value) => {
  if (!value) {
    return
  }

  // TODO
  // temporary fix while there is no way to disable the alpha channel in the
  // colorpicker component: https://github.com/vuetifyjs/vuetify/issues/9590
  if (value.toString().match(/#[a-zA-Z0-9]{8}/)) {
    color.value = value.substring(0, 7)
  }

  if (categoryData.value.color && value.includes(categoryData.value.color)) {
    return
  }

  categoryData.value.color = value.substring(1)

  const isColorAlreadyAssigned = categoriesList.value.some(
    (cat) =>
      color.value.toLowerCase().includes(cat.color.toLowerCase())
        && cat.id !== categoryData.value.id,
  )

  colorWarningMsg.value = isColorAlreadyAssigned
    ? 'Color already assinged.'
    : ''

  formCmp.value?.validate()
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
    content-class="edit-category-modal"
    :model-value="show"
    persistent
    no-click-animation
  >
    <v-card outlined>
      <v-card-title class="text-primary">
        {{ titleModal }}
      </v-card-title>

      <v-card-text class="modal-body">
        <v-container>
          <v-form v-model="isFormValid" ref="formCmp">
            <v-row>
              <v-col v-if="!add" class="pt-0" cols="12">
                <v-text-field
                  :model-value="categoryData.id"
                  label="Id"
                  hide-details
                  disabled
                  variant="underlined"
                />
              </v-col>

              <v-col class="pt-0" cols="12">
                <v-text-field
                  v-model="categoryData.name"
                  autofocus
                  :rules="[rules.required, rules.isNameNotExists]"
                  label="Name"
                  required
                  variant="underlined"
                />
              </v-col>

              <v-col class="pt-0" cols="12">
                <v-alert
                  v-if="colorWarningMsg"
                  class="color-warning-alert"
                  type="warning"
                  icon="mdi-alert"
                  density="compact"
                >
                  {{ colorWarningMsg }}
                </v-alert>

                <v-color-picker
                  v-model="color"
                  class="color-picker"
                  dot-size="25"
                  swatches-max-height="100%"
                  mode="hexa"
                  show-swatches
                  width="100%"
                  hide-canvas
                />
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
          color="primary"
          tabindex="0"
          @click="onConfirm"
        >
          {{ confirmBtnText }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <CircularLoading class="loading" v-if="loading" indeterminate />

    <DeleteModal
      v-if="!add"
      :show="showDeleteModal"
      @confirm="closeConfirmDelete({ deleteCat: true })"
      @cancel="closeConfirmDelete"
      @click:outside="closeConfirmDelete"
    >
      <template v-slot:message>Delete this category?</template>
    </DeleteModal>
  </v-dialog>
</template>

<style lang="scss">
/* FYI: As Vuetify v-dialog is injected at root in DOM, style cannot be scoped. */

.edit-category-modal {
  .modal-body {
    height: calc(100vh - 300px);
    overflow: auto;

    .color-warning-alert {
      margin-bottom: -10px;
      z-index: 1;
    }
  }

  .loading {
    position: absolute;
    top: 0;
    left: 0;
    background-color: #{$grey-8 + '80'};
    z-index: 100;
  }
}
</style>
