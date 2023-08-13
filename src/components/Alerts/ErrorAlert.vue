<script setup lang="ts">
// Types
import { ErrorAlert } from '@/models/Alerts/errorAlert'

// Vendors Libs
import { computed } from 'vue'

// Stores
import { AlertType } from '@/models/Alerts/abstractAlert'
import { dateFormated as dateFormatedUtils } from '@/utils/dateUtils'

// Props
const props = withDefaults(defineProps<{
  errorAlert: ErrorAlert
  closable?: boolean
}>(), {
  closable: true,
})

// Emits
const emit = defineEmits<{
  close: []
}>()

const customError = computed(() => props.errorAlert.error)

const dateFormated = computed(() => dateFormatedUtils(customError.value.date))

function onClose (): void {
  emit('close')
}
</script>

<template>
  <div class="error-alert">
    <v-alert
      :closable="closable"
      border="start"
      :border-color="AlertType.Error"
      variant="tonal"
      :type="AlertType.Error"
      @click:close="onClose"
    >
      <template #title>
        <div>{{ errorAlert.message }}</div>
      </template>

      <template #default>
        <div class="body">
          <div>{{ dateFormated }}</div>
          <div>Public Message: {{ customError.publicMessage }}</div>
          <div>Message: {{ customError.message }}</div>
          <div>Action name: {{ customError.actionName }}</div>
          <div>File: {{ customError.file }}</div>
          <div>{{ customError.isBackend ? 'backend' : 'frontend' }}</div>
          <div style="margin-top: 10px;">Raw error:</div>
          <div>{{ customError.error }}</div>
        </div>
      </template>
    </v-alert>
  </div>
</template>

<style lang="scss" scoped>
.error-alert {
  box-shadow: 0px 10px 20px $grey-8;

  .body {
    color: white;
  }
}
</style>
