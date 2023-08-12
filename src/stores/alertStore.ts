// Types
import { AlertType, type AlertId } from '@/models/Alerts/abstractAlert'
import type { ErrorAlert } from '@/models/Alerts/errorAlert'
import type { InfoAlert } from '@/models/Alerts/infoAlert'
import type { WarningAlert } from '@/models/Alerts/warningAlert'

// Vendors Libs
import { createGlobalState } from '@vueuse/core'

// Models
import useReactiveMap from '@/logic/useReactiveMap'

import { useMainStore } from './mainStore'
import { computed } from 'vue'

export type CustomAlert = ErrorAlert | InfoAlert | WarningAlert

export const useAlertStore = createGlobalState(() => {
  const { showFloatingAlert } = useMainStore()

  const alerts = useReactiveMap<AlertId, CustomAlert>()

  const alertsList = computed<Array<CustomAlert>>(() => Array.from(alerts.value.values()))

  const errorsList = computed<Array<ErrorAlert>>(
    () => alertsList.value.filter((a) => a.type === AlertType.Error) as Array<ErrorAlert>,
  )

  function get (alertId: AlertId): CustomAlert | undefined {
    return alerts.value.get(alertId)
  }

  function add (customAlert: CustomAlert, silent = false): CustomAlert {
    alerts.value.set(customAlert.id, customAlert)

    if (!silent) {
      showFloatingAlert.value = true
    }

    return customAlert
  }

  function remove (alertId: number): boolean {
    return alerts.value.delete(alertId)
  }

  function reset (): void {
    alerts.value.clear()
  }

  return {
    alerts,
    alertsList,
    errorsList,

    get,
    add,
    remove,
    reset,
  }
})
