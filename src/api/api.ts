import { createError } from '@/models/error'

export const BASE_URL = import.meta.env.VITE_BASE_URL || ''

export const getHeaders = () => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
})

export const fetchJson = async (url: string, opts: object) => {
  const headersOpts = { headers: getHeaders() }
  const response = await fetch(url, { ...opts, ...headersOpts })
  const json = await response.json()

  if (json.error) {
    throw createError(json.error, {
      file: 'api.ts',
    })
  }

  return json
}
