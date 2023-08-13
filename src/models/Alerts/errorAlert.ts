import { logError } from '@/utils/errorUtils'
import { CustomError, createCustomError, extractErrorInfo } from '../customError'
import { AbstractAlert, AlertType } from './abstractAlert'

export class ErrorAlert extends AbstractAlert {
  error: CustomError

  constructor (error: any) {
    const {
      publicMessage,
      message,
    } = extractErrorInfo(error)

    super({
      type: AlertType.Error,
      message: publicMessage || message || 'unknown error message.',
    })

    this.error = error instanceof CustomError
      ? error
      : logError(createCustomError(error, {
        file: 'errorAlert.ts',
        actionName: 'ErrorAlert#constructor',
        isBackend: false,
      }))
  }
}

export function createErrorAlert (error: any) {
  return new ErrorAlert(error)
}
