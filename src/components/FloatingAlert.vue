<script setup lang="ts">
// Types
import type { CustomAlert } from '@/stores/alertStore'
import type { ErrorAlert } from '@/models/Alerts/errorAlert'

// Vendors Libs
import { computed, ref } from 'vue'

// Stores
import { useAlertStore } from '@/stores/alertStore'

// Components
import ErrorAlertCmp from '@/components/TheErrors/ErrorAlert.vue'
import { ErrorAlert as ErrorAlertClass } from '@/models/Alerts/errorAlert'

const props = withDefaults(defineProps<{
  show?: boolean;
}>(), {
  show: false,
})

// Stores
const { alertsList } = useAlertStore()

const alertIndex = ref(alertsList.value.length - 1)

const customAlert = computed<CustomAlert>(() => alertsList.value[ alertIndex.value ])

const errorAlert = computed<ErrorAlert | undefined>(
  () => customAlert.value instanceof ErrorAlertClass
    ? customAlert.value
    : undefined,
)
</script>

<template>
  <div v-if="show" class="floating-alert">
    <template v-if="errorAlert">
      <ErrorAlertCmp :error-alert="errorAlert"/>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.floating-alert {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999999;
}

.scrollable {
  @include w-scrollbar(auto, hidden);
}
</style>
