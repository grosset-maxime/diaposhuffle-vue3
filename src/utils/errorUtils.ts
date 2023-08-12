import {
  buildCustomError,
  type CustomError,
  type CustomErrorConstructorData,
} from '@/models/customError'

import {
  ON_LOG_ERROR,
  emitter,
} from '@/logic/useEmitter'

export const ERRORS_LOG_LS_NAME = 'ds3-errors-log'

const serializer = {
  read: (v: string | null): CustomError[] => {
    const errorsLogs = (JSON.parse(v || '[]') || []) as CustomErrorConstructorData[]
    return errorsLogs.map((error) => buildCustomError(error))
  },
  write: (v: CustomError[]): string => JSON.stringify(v),
}

const LS = {
  readErrorsLogs (): CustomError[] {
    return serializer.read(localStorage.getItem(ERRORS_LOG_LS_NAME))
  },
  writeErrorsLogs (errorsLogs: CustomError[]) {
    localStorage.setItem(ERRORS_LOG_LS_NAME, serializer.write(errorsLogs))
  },
}

export const logError = (error: CustomError): CustomError => {
  try {
    const errorsLogs = LS.readErrorsLogs()

    errorsLogs.push(error)

    LS.writeErrorsLogs(errorsLogs)

    emitter.emit(ON_LOG_ERROR, error)
  } catch (er) { /* Fail silently */ }

  return error
}

export const getErrorsLogs = (): CustomError[] => {
  try {
    return LS.readErrorsLogs()
  } catch (e) { /* Fail silently */ }

  return []
}

export const removeErrorLog = (index: number): CustomError | undefined => {
  try {
    const errorsLogs = LS.readErrorsLogs()

    const removedError = (errorsLogs.splice(index, 1))[ 0 ]

    LS.writeErrorsLogs(errorsLogs)

    return removedError

  } catch (er) { /* Fail silently */ }

  return
}

export const removeAllErrorsLogs = (): void => {
  try {
    LS.writeErrorsLogs([])
  } catch (er) { /* Fail silently */ }
}
