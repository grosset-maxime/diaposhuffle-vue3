<script setup lang="ts">
// Types
import { WarningAlert } from '@/models/Alerts/warningAlert'

// Vendors Libs
import { computed } from 'vue'

// Stores
import { useAlertStore } from '@/stores/alertStore'
import type { AlertType } from '@/models/Alerts/abstractAlert'

// Props
const props = withDefaults(defineProps<{
  warningAlert: WarningAlert
  closable?: boolean
  mode?: 'single' | 'listItem'
}>(), {
  closable: false,
  mode: 'single',
})

// Stores
const alertStore = useAlertStore()

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
    // borderColor: isListItem
    //   ? props.warningAlert.severity
    //   : undefined,
    // type: isSingle
    //   ? props.warningAlert.severity
    //   : undefined,
    icon: isSingle
      ? 'mdi-error'
      : undefined,
  }
  return mode
})

function onClose (): void {
  alertStore.remove(props.warningAlert.id)
}
</script>

<template>
  <div class="warning-alert" :class="{
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
      :text="warningAlert.message"
      @click:close="onClose"
    />
  </div>
</template>

<style lang="scss" scoped>
</style>
