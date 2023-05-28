let errorIdTracker: number = 1

export enum ERROR_SEVERITY {
  'error' = 'error',
  'warn' = 'warning',
  'info' = 'info'
}

export interface CustomErrorData {
  file?: string
  actionName?: string
  isBackend?: boolean
}

export const ERROR_SEVERITY_ERROR = ERROR_SEVERITY.error
export const ERROR_SEVERITY_WARN = ERROR_SEVERITY.warn
export const ERROR_SEVERITY_INFO = ERROR_SEVERITY.info

export type CustomErrorId = number
export class CustomError {
  id: CustomErrorId
  error: boolean
  message: string
  publicMessage: string
  severity: ERROR_SEVERITY
  actionName: string
  file: string
  isBackend: boolean

  constructor (e: any, { file, actionName, isBackend }: CustomErrorData) {
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

    this.id = errorIdTracker
    this.error = true
    this.message = message
    this.publicMessage = publicMessage
    this.severity = severity
    this.actionName = actionName || ''
    this.file = file || ''
    this.isBackend = !!isBackend

    errorIdTracker = errorIdTracker + 1
  }
}

export function createError (error: any, errorData: CustomErrorData) {
  console.error(error, errorData)
  return new CustomError(error, errorData)
}
