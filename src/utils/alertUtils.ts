import { AlertType } from '@/models/Alerts/abstractAlert'
import { createErrorAlert } from '@/models/Alerts/errorAlert'
import { createInfoAlert } from '@/models/Alerts/infoAlert'
import { createWarningAlert } from '@/models/Alerts/warningAlert'
import { logError } from './errorUtils'
import { createCustomError, CustomErrorSeverity, extractErrorInfo } from '@/models/customError'

export const createAlert = ({
  message,
  type,
  error,
}: {
  type?: AlertType | CustomErrorSeverity
  message?: string,
  error?: any,
}) => {
  let errorInfo: ReturnType<typeof extractErrorInfo> | undefined

  if (error) {
    errorInfo = extractErrorInfo(error)
  }

  if (!type && errorInfo) {
    type = errorInfo.severity
  }

  if (type === AlertType.Error) {

    return createErrorAlert(error)

  } else if (type === AlertType.Info) {

    if (!message && errorInfo) {
      message = errorInfo.publicMessage || errorInfo.message
    }

    return createInfoAlert({ message: message || 'Empty message...' })

  } else if (type === AlertType.Warning) {

    if (!message && errorInfo) {
      message = errorInfo.publicMessage || errorInfo.message
    }

    return createWarningAlert({ message: message || 'Empty message...' })

  } else {
    throw logError(
      createCustomError('Unknown AlertType.', {
        file: 'alertUtils.ts',
        actionName: 'createAlert',
        isBackend: false,
      }),
    )
  }
}