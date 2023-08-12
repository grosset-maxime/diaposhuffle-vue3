import { ON_LOG_ERROR, emitter } from '@/logic/useEmitter'
import type { CustomError } from '@/models/customError'
import { getErrorsLogs, removeErrorLog, removeAllErrorsLogs } from '@/utils/errorUtils'
import { createGlobalState } from '@vueuse/core'
import { ref } from 'vue'

export const useErrorLogStore = createGlobalState(() => {
  const errors = ref<CustomError[]>(getErrorsLogs())

  function get (index: number): CustomError {
    return errors.value[ index ]
  }

  function remove (index: number): void {
    errors.value.splice(index, 1)
    errors.value = errors.value.slice()

    removeErrorLog(index)
  }

  function removeAll (): void {
    errors.value = []
    removeAllErrorsLogs()
  }

  function onLogError () {
    errors.value = getErrorsLogs()
  }

  emitter.on(ON_LOG_ERROR, onLogError)

  return {
    errors,

    get,
    remove,
    removeAll,
  }
})
