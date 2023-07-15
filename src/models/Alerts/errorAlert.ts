import { AbstractAlert, AlertType } from './abstractAlert'

export enum ERROR_SEVERITY {
  Error = 'error',
  Warn = 'warning',
  Info = 'info'
}

export interface ErrorAlertData {
  file?: string
  actionName?: string
  isBackend?: boolean
}

export const ERROR_SEVERITY_ERROR = ERROR_SEVERITY.Error
export const ERROR_SEVERITY_WARN = ERROR_SEVERITY.Warn
export const ERROR_SEVERITY_INFO = ERROR_SEVERITY.Info

export class ErrorAlert extends AbstractAlert {
  error: boolean
  publicMessage: string
  severity: ERROR_SEVERITY
  actionName: string
  file: string
  isBackend: boolean
  date: Date

  constructor (e: any, { file, actionName, isBackend }: ErrorAlertData) {
    let error = e
    let publicMessage
    let message
    let severity = ERROR_SEVERITY_ERROR

    if (typeof error === 'string') {
      error = { message: error, publicMessage: error, severity: ERROR_SEVERITY_ERROR }
    }

    try {
      message = error.message || error.toString()
      publicMessage = error.publicMessage || error.toString()
      severity = error.severity || ERROR_SEVERITY_ERROR
    } catch (er: unknown) {
      message = er?.toString()
      publicMessage = er?.toString()
      severity = error?.severity ?? ERROR_SEVERITY_ERROR
    }

    super({ type: AlertType.Error, message })

    this.error = true
    this.publicMessage = publicMessage
    this.severity = severity
    this.actionName = actionName || ''
    this.file = file || ''
    this.isBackend = !!isBackend
    this.date = new Date()
  }
}

export function createErrorAlert (error: any, errorData: ErrorAlertData) {
  console.error('### error:', error, errorData)
  return new ErrorAlert(error, errorData)
}
