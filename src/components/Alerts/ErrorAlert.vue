<script setup lang="ts">
// Types
import { ErrorAlert } from '@/models/Alerts/errorAlert'

// Vendors Libs
import { computed } from 'vue'

// Stores
import { useAlertStore } from '@/stores/alertStore'
import type { AlertType } from '@/models/Alerts/abstractAlert'

// Props
const props = withDefaults(defineProps<{
  errorAlert: ErrorAlert
  closable?: boolean
  mode?: 'single' | 'listItem'
}>(), {
  closable: false,
  mode: 'single',
})

// Stores
const alertStore = useAlertStore()

const dateFormated = computed(() => {
  const date = props.errorAlert.date || new Date()

  let weekDay = date.toLocaleDateString(window.navigator.language, { weekday: 'long' })

  weekDay = `${weekDay.charAt(0).toUpperCase()}${weekDay.slice(1)}`

  return `${weekDay} ${date.toLocaleDateString()} - ${date.toLocaleTimeString()}`
})

const mode = computed(() => {
  const isSingle = props.mode === 'single'
  const isListItem = props.mode === 'listItem'
  const mode: {
    variant?: 'text' | 'flat' | 'elevated' | 'tonal' | 'outlined' | 'plain'
    border?: 'start'
    borderColor?: string
    type?: AlertType
    icon?: string
  } = {
    variant: isListItem
      ? 'tonal'
      : 'flat',
    border: isListItem
      ? 'start'
      : undefined,
    borderColor: isListItem
      ? props.errorAlert.severity
      : undefined,
    type: isSingle
      ? props.errorAlert.severity
      : undefined,
    icon: isSingle
      ? 'mdi-error'
      : undefined,
  }
  return mode
})

function onClose (): void {
  alertStore.remove(props.errorAlert.id)
}
</script>

<template>
  <div class="error-alert" :class="{
    'mode-single': props.mode === 'single',
    'mode-listItem': props.mode === 'listItem'
  }">
    <v-alert
      :closable="closable"
      :border="mode.border"
      :border-color="mode.borderColor"
      :variant="mode.variant"
      :type="mode.type"
      :icon="mode.icon"
      @click:close="onClose"
    >
      <template #title>
        <div>{{ errorAlert.publicMessage }}</div>
      </template>

      <template #default>
        <div class="body">
          <div>{{ dateFormated }}</div>
          <div>Message: {{ errorAlert.message }}</div>
          <div>Action name: {{ errorAlert.actionName }}</div>
          <div>File: {{ errorAlert.file }}</div>
          <div>{{ errorAlert.isBackend ? 'backend' : 'frontend' }}</div>
        </div>
      </template>
    </v-alert>
  </div>
</template>

<style lang="scss" scoped>
.error-alert {
  &.mode-single {
    box-shadow: 0px 10px 200px #888;
  }
}
</style>
