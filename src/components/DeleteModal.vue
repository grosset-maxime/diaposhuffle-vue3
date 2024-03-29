<script setup lang="ts">
// Types
import type { Fn } from '@vueuse/core'

// Vendors Libs
import { watch } from 'vue'
import { useEventListener } from '@vueuse/core'

import { getKey } from '@/utils/utils'

let stopKeyboardShortcuts: Fn | null

// Props
interface Props {
  show?: boolean;
  showPreview?: boolean;
  showSrc?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  show: false,
  showPreview: false,
  showSrc: false,
})

// Emits
const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
  (e: 'click:outside'): void;
}>()

// Watchers
watch(
  () => props.show,
  (isShow) => {
    if (isShow) {
      attachKeyboardShortcuts()
    } else {
      removeKeyboardShortcuts()
    }
  },
)

// Methods
function onConfirm () {
  emit('confirm')
}

function onCancel () {
  emit('cancel')
}

function keyboardShortcuts (e: KeyboardEvent) {
  const key = getKey(e)

  switch (key) {
  case 'Enter':
    onConfirm()
    break

  case 'Escape':
    onCancel()
    break
  default:
  }
}

function attachKeyboardShortcuts () {
  if (stopKeyboardShortcuts) {
    return
  }
  stopKeyboardShortcuts = useEventListener(document, 'keydown', keyboardShortcuts)
}

function removeKeyboardShortcuts () {
  stopKeyboardShortcuts && stopKeyboardShortcuts()
  stopKeyboardShortcuts = null
}
</script>

<template>
  <v-dialog
    content-class="delete-modal"
    :model-value="show"
    persistent
    no-click-animation
    scrim="surface"
    @click:outside="emit('click:outside')"
  >
    <div class="delete-modal-body">
      <div class="message">
        <div v-if="showPreview" class="preview-slot-ctn">
          <!-- @slot preview of the item. -->
          <slot name="preview" />
        </div>

        <div class="message-slot-ctn">
          <!-- @slot slot to display delete confirm message. -->
          <slot name="message"> Delete this item? </slot>
        </div>
      </div>

      <div v-if="showSrc" class="src-slot-ctn">
        <!-- @slot Src of the item. -->
        <slot name="src" />
      </div>
    </div>

    <v-divider class="separator" />

    <div class="modal-btns">
      <v-btn
        class="modal-btn"
        @click="onCancel"
      >
        Cancel
      </v-btn>
      <v-btn
        class="modal-btn"
        color="primary"
        @click="onConfirm"
      >
        Delete
      </v-btn>
    </div>
  </v-dialog>
</template>

<style lang="scss">
/* FYI: As Vuetify v-dialog is injected at root in DOM, style cannot be scoped. */

.delete-modal.delete-modal.delete-modal {
  top: 0;
  align-items: center;
  background: #{$grey-7 + '90'};
  padding: 15px;
  width: 800px;
  border-radius: 5px;
  backdrop-filter: blur(5px);

  .separator {
    margin: 4px 0;
  }

  .delete-modal-body {
    min-height: 50px;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .message {
      display: flex;
      align-items: center;

      .preview-slot-ctn {
        margin-right: 20px;
        height: 100px;
        width: 100px;
        overflow: hidden;

        .preview {
          object-fit: contain;
          width: 100%;
          height: 100%;
        }
      }
    }

    .src-slot-ctn {
      margin-top: 5px;
      margin-bottom: 5px;
    }
  }

  .modal-btns {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 8px;

    .modal-btn {
      width: 100px;
      margin-left: 20px;
    }
  }
}
</style>
