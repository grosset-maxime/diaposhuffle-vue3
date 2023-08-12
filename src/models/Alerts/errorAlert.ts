import { AbstractAlert, AlertType } from './abstractAlert'

export interface ErrorAlertData {
  file?: string
  actionName?: string
  isBackend?: boolean
}

export const ERROR_SEVERITY_ERROR = AlertType.Error
export const ERROR_SEVERITY_WARN = AlertType.Warning
export const ERROR_SEVERITY_INFO = AlertType.Info

export class ErrorAlert extends AbstractAlert {
  e: unknown
  error: boolean
  publicMessage: string
  severity: AlertType
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
      publicMessage = error.publicMessage || error.message || error.toString()
      severity = error.severity || ERROR_SEVERITY_ERROR
    } catch (er: unknown) {
      message = er && (er as any).toString
        ? (er as any).toString()
        : 'unknown error message.'
      publicMessage = er && (er as any).toString
        ? (er as any).toString()
        : 'unknown public error message.'
      severity = error?.severity ?? ERROR_SEVERITY_ERROR
    }

    super({ type: AlertType.Error, message })

    this.e = e
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
