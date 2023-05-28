// Types
import type { CustomErrorId, CustomError, CustomErrorData } from '@/models/error'

// Vendors Libs
import { createGlobalState } from '@vueuse/core'

// Models
import { createError } from '@/models/error'
import useReactiveMap from '@/logic/useReactiveMap'

export const useErrorStore = createGlobalState(() => {
  const errors = useReactiveMap<CustomErrorId, CustomError>()

  function get (errorId: number): CustomError | undefined {
    return errors.value.get(errorId)
  }

  function add (error: unknown, errorData: CustomErrorData): CustomError {
    const err: CustomError = createError(error, errorData)
    errors.value.set(err.id, err)
    return err
  }

  function remove (errorId: number): boolean {
    return errors.value.delete(errorId)
  }

  function reset (): void {
    errors.value.clear()
  }

  return {
    errors,

    get,
    add,
    remove,
    reset,
  }
})
