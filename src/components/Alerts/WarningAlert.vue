<script setup lang="ts">
// Types
import type { WarningAlert } from '@/models/Alerts/warningAlert'

// Stores
import { AlertType } from '@/models/Alerts/abstractAlert'

// Props
withDefaults(defineProps<{
  warningAlert: WarningAlert
  closable?: boolean
}>(), {
  closable: true,
})

// Emits
const emit = defineEmits<{
  close: []
}>()

function onClose (): void {
  emit('close')
}
</script>

<template>
  <div class="warning-alert">
    <v-alert
      :closable="closable"
      border="start"
      :border-color="AlertType.Warning"
      variant="tonal"
      :type="AlertType.Warning"
      @click:close="onClose"
    >
      <template #default>
        <div class="body">
          {{ warningAlert.message }}
        </div>
        <slot name='footer'/>
      </template>
    </v-alert>
  </div>
</template>

<style lang="scss" scoped>
</style>
