// Types
import type { CustomError, CustomErrorData } from '@/models/error'

// Vendors Libs
import { ref } from 'vue'
import { createGlobalState } from '@vueuse/core'

// Models
import { createError } from '@/models/error'

export const useErrorStore = createGlobalState(() => {
  const errors = ref<Array<CustomError>>([])

  function get (errorId: number): CustomError | undefined {
    return errors.value.find((err) => err.id === errorId)
  }

  function add (error: unknown, errorData: CustomErrorData): CustomError {
    const err: CustomError = createError(error, errorData)
    errors.value = [ ...errors.value, err ]
    return err
  }

  function remove (errorId: number): void {
    errors.value = errors.value.filter((err: CustomError) => err.id !== errorId)
  }

  function reset (): void {
    errors.value = []
  }

  return {
    errors,

    get,
    add,
    remove,
    reset,
  }
})
