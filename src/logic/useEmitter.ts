import { createError } from '@/models/error'
import { getCurrentInstance } from 'vue'

export default function useEmitter () {
  const internalInstance = getCurrentInstance()

  if (!internalInstance) {
    throw createError('Vue internal instance is undefined', {
      file: 'useEmitter.ts',
    })
  }

  const emitter = internalInstance.appContext.config.globalProperties.emitter

  return emitter
}