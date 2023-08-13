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


export function extractErrorInfo (error: any) {
  let publicMessage: string | undefined
  let message: string | undefined
  let severity = CustomErrorSeverity.Error
  let _error = error

  try {
    if (typeof error === 'string') {
      message = error
      publicMessage = error
      error = { message, publicMessage, severity }
    } else if (typeof error === 'object') {
      message = error.message
      publicMessage = error.publicMessage || error.message
      severity = error.severity || severity
    }

    if (error instanceof CustomError) {
      _error = error.error
    }

  } catch (er) { /* Fail silently */ }

  return {
    _error,
    message,
    publicMessage,
    severity,
  }
}

export function createCustomError (error: any, errorData: CustomErrorData) {
  console.error('### error:', error, errorData)

  const {
    message,
    publicMessage,
    severity,
    _error,
  } = extractErrorInfo(error)

  return new CustomError({
    error: _error,
    message,
    publicMessage,
    severity,
    ...errorData,
  })
}

export function buildCustomError (error: CustomErrorConstructorData) {
  return new CustomError(error)
}
