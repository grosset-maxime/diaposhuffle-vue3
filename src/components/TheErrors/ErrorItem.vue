<script setup lang="ts">
// Vendors Libs
import { computed } from 'vue'

import type { CustomError, CustomErrorSeverity } from '@/models/customError'
import { dateFormated as dateFormatedUtils } from '@/utils/dateUtils'

// Props
const props = withDefaults(defineProps<{
  customError: CustomError
}>(), {
})

// Emits
const emit = defineEmits<{
  remove: []
}>()

const dateFormated = computed(() => dateFormatedUtils(props.customError.date))

const mode = computed(() => {
  const mode: {
    variant?: 'text' | 'flat' | 'elevated' | 'tonal' | 'outlined' | 'plain'
    border?: 'start'
    borderColor?: string
    type?: CustomErrorSeverity,
    icon?: string
  } = {
    variant: 'tonal',
    border: 'start',
    borderColor: props.customError.severity,
    type: props.customError.severity,
  }

  return mode
})

function onClose () {
  emit('remove')
}
</script>

<template>
  <div class="error-item">
    <v-alert
      closable
      :border="mode.border"
      :border-color="mode.borderColor"
      :variant="mode.variant"
      :type="mode.type"
      @click:close="onClose()"
    >
      <template #title>
        <div>{{ customError.publicMessage }}</div>
      </template>

      <template #default>
        <div class="body">
          <div>{{ dateFormated }}</div>
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
.error-item {
  .body {
    color: white;
  }
}
</style>
