<script setup lang="ts">
// Types
import type { CustomAlert } from '@/stores/alertStore'
import type { ErrorAlert } from '@/models/Alerts/errorAlert'

// Vendors Libs
import { computed, ref } from 'vue'

// Stores
import { useAlertStore } from '@/stores/alertStore'

// Components
import ErrorAlertCmp from '@/components/Alerts/ErrorAlert.vue'
import InfoAlertCmp from '@/components/Alerts/InfoAlert.vue'
import WarningAlertCmp from '@/components/Alerts/WarningAlert.vue'
import { ErrorAlert as ErrorAlertClass } from '@/models/Alerts/errorAlert'
import { InfoAlert as InfoAlertClass } from '@/models/Alerts/infoAlert'
import { type WarningAlert, WarningAlert as WarningAlertClass } from '@/models/Alerts/warningAlert'
import { watch } from 'vue'
import type { InfoAlert } from '@/models/Alerts/infoAlert'

const props = withDefaults(defineProps<{
  show?: boolean;
}>(), {
  show: false,
})

const emit = defineEmits<{
  close: []
}>()

// Stores
const { alertsList } = useAlertStore()

const alertIndex = ref(alertsList.value.length - 1)

const customAlert = computed<CustomAlert>(() => alertsList.value[ alertIndex.value ])

const errorAlert = computed<ErrorAlert | undefined>(
  () => customAlert.value instanceof ErrorAlertClass
    ? customAlert.value
    : undefined,
)
const infoAlert = computed<InfoAlert | undefined>(
  () => customAlert.value instanceof InfoAlertClass
    ? customAlert.value
    : undefined,
)
const warningAlert = computed<WarningAlert | undefined>(
  () => customAlert.value instanceof WarningAlertClass
    ? customAlert.value
    : undefined,
)

watch(
  () => props.show,
  () => alertIndex.value = alertsList.value.length - 1,
)

function onClose () {
  emit('close')
}

</script>

<template>
  <div v-if="show" class="floating-alert">
    <div class="close-btn" v-if="false">
      <v-btn icon="mdi-close" @click="onClose" />
    </div>
    <template v-if="errorAlert">
      <ErrorAlertCmp
        :error-alert="errorAlert"
        @close="onClose"
      />
    </template>
    <template v-if="infoAlert">
      <InfoAlertCmp
        :info-alert="infoAlert"
        @close="onClose"
      />
    </template>
    <template v-if="warningAlert">
      <WarningAlertCmp
        :warning-alert="warningAlert"
        @close="onClose"
      />
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
  padding: 20px;
  background-color: #ffffff10;
  backdrop-filter: blur(5px);
  cursor: not-allowed;

  .close-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    z-index: 999999;
  }
}
</style>
