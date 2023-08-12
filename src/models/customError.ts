export interface CustomErrorData {
  file?: string
  actionName?: string
  isBackend?: boolean
}

export enum CustomErrorSeverity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info'
}

export interface CustomErrorConstructorData {
  error: unknown
  message?: string
  publicMessage?: string
  severity?: CustomErrorSeverity
  actionName?: string
  file?: string
  isBackend?: boolean
  date?: Date | string
}

export class CustomError {
  error: unknown
  message: string
  publicMessage: string
  severity: CustomErrorSeverity
  actionName: string
  file: string
  isBackend: boolean
  date: Date

  constructor ({
    error,
    message,
    publicMessage,
    severity,
    actionName,
    file,
    isBackend,
    date,
  }: CustomErrorConstructorData) {

    this.error = error
    this.message = message || 'no error message...'
    this.publicMessage = publicMessage || 'no public error message...'
    this.severity = severity || CustomErrorSeverity.Error
    this.actionName = actionName || ''
    this.file = file || ''
    this.isBackend = !!isBackend
    this.date = date
      ? new Date(date)
      : new Date()
  }
}

export function createCustomError (error: any, errorData: CustomErrorData) {
  console.error('### error:', error, errorData)

  let publicMessage
  let message
  let severity = CustomErrorSeverity.Error

  try {
    if (typeof error === 'string') {
      message = error
      publicMessage = error
      error = { message, publicMessage, severity: CustomErrorSeverity.Error }
    } else if (typeof error === 'object') {
      message = error.message
      publicMessage = error.publicMessage || error.message
      severity = error.severity
    }

    if (error instanceof CustomError) {
      error = error.error
    }

  } catch (er) { /* Fail silently */ }

  return new CustomError({
    error,
    message,
    publicMessage,
    severity,
    ...errorData,
  })
}

export function buildCustomError (error: CustomErrorConstructorData) {
  return new CustomError(error)
}
