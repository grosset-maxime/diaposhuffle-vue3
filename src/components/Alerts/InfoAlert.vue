<script setup lang="ts">
// Types
import type { InfoAlert } from '@/models/Alerts/infoAlert'

// Stores
import { AlertType } from '@/models/Alerts/abstractAlert'

// Props
withDefaults(defineProps<{
  infoAlert: InfoAlert
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
  <div class="info-alert">
    <v-alert
      :closable="closable"
      border="start"
      :border-color="AlertType.Info"
      variant="tonal"
      :type="AlertType.Info"
      @click:close="onClose"
    >
      <template #default>
        <div class="body">
          {{ infoAlert.message }}
        </div>
        <slot name='footer'/>
      </template>
    </v-alert>
  </div>
</template>

<style lang="scss" scoped>
</style>
