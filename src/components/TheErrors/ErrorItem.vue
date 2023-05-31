<script setup lang="ts">
// Types
import type { CustomError, CustomErrorId } from '@/models/error'

// Vendors Libs
import { computed } from 'vue'

// Stores
import { useErrorStore } from '@/stores/errorStore'

// Components

// Props
interface Props {
  errorId: CustomErrorId;
}
const props = defineProps<Props>()

// Stores
const errorStore = useErrorStore()

const error = computed<CustomError | undefined>(() => errorStore.errors.value.get(props.errorId))

const dateFormated = computed(() => {
  const date = error.value?.date || new Date()
  let weekDay = date.toLocaleDateString(window.navigator.language, { weekday: 'long' })
  weekDay = `${weekDay.charAt(0).toUpperCase()}${weekDay.slice(1)}`
  return `${weekDay} ${date.toLocaleDateString()} - ${date.toLocaleTimeString()}`
})

function onClose (): void {
  errorStore.remove(props.errorId)
}
</script>

<template>
  <div class="error-item" v-if="error">
    <!-- :type="error.severity" -->
    <v-alert
      closable
      border="start"
      :border-color="error.severity"
      variant="tonal"
      @click:close="onClose"
    >
      <template #title>
        <div>{{ error.publicMessage }}</div>
      </template>

      <template #default>
        <div>{{ dateFormated }}</div>
        <div>Message: {{ error.message }}</div>
        <div>Action name: {{ error.actionName }}</div>
        <div>File: {{ error.file }}</div>
        <div>{{ error.isBackend ? 'backend' : 'frontend' }}</div>
      </template>
    </v-alert>
  </div>
</template>

<style lang="scss" scoped>
.error-item {

}
</style>
