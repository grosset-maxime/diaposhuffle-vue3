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
import { AlertType } from '@/models/Alerts/abstractAlert'

const props = withDefaults(defineProps<{
  show?: boolean;
  customAlert?: ErrorAlert | InfoAlert | WarningAlert
}>(), {
  show: false,
  errorAlert: undefined,
})

const emit = defineEmits<{
  close: []
}>()

// Stores
const { alertsList } = useAlertStore()

const alertIndex = ref(alertsList.value.length - 1)

const _customAlert = computed<CustomAlert>(() => alertsList.value[ alertIndex.value ])

const _errorAlert = computed<ErrorAlert | undefined>(() => {
  if (props.customAlert?.type === AlertType.Error)
    return props.customAlert as ErrorAlert
  else if (_customAlert.value instanceof ErrorAlertClass)
    return _customAlert.value
  else
    return undefined
})

const infoAlert = computed<InfoAlert | undefined>(() => {
  if (props.customAlert?.type === AlertType.Info)
    return props.customAlert as InfoAlert
  else if (_customAlert.value instanceof InfoAlertClass)
    return _customAlert.value
  else
    return undefined
})

const warningAlert = computed<WarningAlert | undefined>(() => {
  if (props.customAlert?.type === AlertType.Warning)
    return props.customAlert as WarningAlert
  else if (_customAlert.value instanceof WarningAlertClass)
    return _customAlert.value
  else
    return undefined
})

watch(
  () => props.show,
  () => alertIndex.value = alertsList.value.length - 1,
)

function onClose () {
  emit('close')
}

</script>

<template>
  <div v-if="show" class="floating-alert-ctn">
    <div class="overlay" />
    <div class="close-btn" v-if="false">
      <v-btn icon="mdi-close" @click="onClose" />
    </div>
    <div class="floating-alert-wrapper">
      <slot name="alert">
        <template v-if="_errorAlert">
          <ErrorAlertCmp
            class="floating-alert floating-alert-error"
            :error-alert="_errorAlert"
            @close="onClose"
          >
            <template #footer>
              <slot name="alertFooter"/>
            </template>
          </ErrorAlertCmp>
        </template>

        <template v-else-if="infoAlert">
          <InfoAlertCmp
            class="floating-alert floating-alert-info"
            :info-alert="infoAlert"
            @close="onClose"
          >
            <template #footer>
              <slot name="alertFooter"/>
            </template>
          </InfoAlertCmp>
        </template>

        <template v-else-if="warningAlert">
          <WarningAlertCmp
            class="floating-alert floating-alert-warning"
            :warning-alert="warningAlert"
            @close="onClose"
          >
            <template #footer>
              <slot name="alertFooter"/>
            </template>
          </WarningAlertCmp>
        </template>
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.floating-alert-ctn {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999999;
  padding: 20px;

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    width: 100vw;
    height: 100vh;
    background-color: #ffffff10;
    backdrop-filter: blur(10px);
    cursor: not-allowed;
  }

  .floating-alert-wrapper {
    position: relative;
    z-index: 2;
  }

  .close-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    z-index: 999999;
  }
}
</style>
