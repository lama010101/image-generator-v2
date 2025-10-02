import { GenerationPayload, GenerationResult } from '@/types/reve'
import { getReveConfig } from '@/lib/settings'

const HISTORY_ERROR = 'Reve API returned an unexpected payload without image data.'

const toNumber = (value: string | null) => {
  const parsed = Number(value ?? '')
  return Number.isFinite(parsed) ? parsed : 0
}

const bufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, Math.min(i + chunk, bytes.length))
    binary += String.fromCharCode(...sub)
  }
  return btoa(binary)
}

const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`)
const trimTrailingSlash = (value: string) =>
  value.endsWith('/') ? value.slice(0, Math.max(1, value.length - 1)) : value

export async function generateImage(payload: GenerationPayload): Promise<GenerationResult> {
  const config = getReveConfig()
  if (!config) throw new Error('REVE configuration is incomplete.')

  const endpoint = `${trimTrailingSlash(config.apiBase)}${normalizePath(config.endpointPath)}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      Accept: config.accept,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    let message = response.statusText
    const errorCode = response.headers.get('X-Reve-Error-Code') ?? 'UNKNOWN_ERROR'

    if (config.accept === 'application/json') {
      const errorBody = await response.json().catch(() => null)
      if (errorBody?.message) message = errorBody.message
    }

    throw new Error(`${errorCode}: ${message}`)
  }

  if (config.accept === 'application/json') {
    const data = (await response.json()) as GenerationResult
    if (!data?.image) throw new Error(HISTORY_ERROR)
    return data
  }

  const arrayBuffer = await response.arrayBuffer()
  const base64Image = bufferToBase64(arrayBuffer)

  return {
    image: base64Image,
    version: response.headers.get('X-Reve-Version') ?? 'unknown',
    content_violation:
      (response.headers.get('X-Reve-Content-Violation') ?? 'false').toLowerCase() === 'true',
    request_id: response.headers.get('X-Reve-Request-Id') ?? '',
    credits_used: toNumber(response.headers.get('X-Reve-Credits-Used')),
    credits_remaining: toNumber(response.headers.get('X-Reve-Credits-Remaining')),
  }
}
