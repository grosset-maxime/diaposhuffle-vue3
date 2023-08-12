import { createCustomError } from '@/models/customError'
import { logError } from '@/utils/errorUtils'

export const BASE_URL = import.meta.env.VITE_BASE_URL || ''

export const getHeaders = () => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
})

export const fetchJson = async (url: string, opts: object) => {
  try {
    const headersOpts = { headers: getHeaders() }
    const response = await fetch(url, { ...opts, ...headersOpts })
    const json = await response.json()

    if (json.error) {
      throw json.error
    }

    return json

  } catch (e) {
    throw logError(createCustomError(e, {
      file: 'api/api.ts',
      actionName: 'fetchJson',
      isBackend: true,
    }))
  }
}
