<script setup lang="ts">
// Types
import type { ErrorAlert } from '@/models/Alerts/errorAlert'

// Vendors Libs
import { computed } from 'vue'

// Stores
import { useAlertStore } from '@/stores/alertStore'

// Props
interface Props {
  errorAlert: ErrorAlert;
}
const props = defineProps<Props>()

// Stores
const alertStore = useAlertStore()

const dateFormated = computed(() => {
  const date = props.errorAlert.date || new Date()

  let weekDay = date.toLocaleDateString(window.navigator.language, { weekday: 'long' })

  weekDay = `${weekDay.charAt(0).toUpperCase()}${weekDay.slice(1)}`

  return `${weekDay} ${date.toLocaleDateString()} - ${date.toLocaleTimeString()}`
})

function onClose (): void {
  alertStore.remove(props.errorAlert.id)
}
</script>

<template>
  <div class="error-alert">
    <!-- :type="error.severity" -->
    <v-alert
      closable
      border="start"
      :border-color="errorAlert.severity"
      variant="tonal"
      @click:close="onClose"
    >
      <template #title>
        <div>{{ errorAlert.publicMessage }}</div>
      </template>

      <template #default>
        <div>{{ dateFormated }}</div>
        <div>Message: {{ errorAlert.message }}</div>
        <div>Action name: {{ errorAlert.actionName }}</div>
        <div>File: {{ errorAlert.file }}</div>
        <div>{{ errorAlert.isBackend ? 'backend' : 'frontend' }}</div>
      </template>
    </v-alert>
  </div>
</template>

<style lang="scss" scoped>
</style>
