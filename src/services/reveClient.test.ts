import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateImage } from './reveClient'
import { getReveConfig } from '@/lib/settings'

vi.mock('@/lib/settings', () => ({
  getReveConfig: vi.fn(),
}))

describe('generateImage', () => {
  const defaultConfig = {
    apiKey: 'key',
    apiBase: 'https://api.reve.com',
    endpointPath: '/v1/image/create',
    accept: 'application/json',
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.spyOn(global, 'fetch')
    ;(getReveConfig as vi.Mock).mockReturnValue(defaultConfig)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns parsed JSON payload when accept is application/json', async () => {
    const payload = { prompt: 'hello', aspect_ratio: '3:2', version: 'latest' }
    const response = {
      image: 'base64data',
      version: 'v1',
      content_violation: false,
      request_id: 'id',
      credits_used: 1,
      credits_remaining: 9,
    }

    ;(fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(response),
      headers: new Headers(),
    })

    const result = await generateImage(payload)
    expect(result).toEqual(response)
  })

  it('falls back to binary parsing when accept is not json', async () => {
    const payload = { prompt: 'hello', aspect_ratio: '3:2', version: 'latest' }
    ;(getReveConfig as vi.Mock).mockReturnValue({ ...defaultConfig, accept: 'image/png' })

    const headers = new Headers({
      'X-Reve-Version': 'v2',
      'X-Reve-Content-Violation': 'false',
      'X-Reve-Request-Id': 'rid',
      'X-Reve-Credits-Used': '2',
      'X-Reve-Credits-Remaining': '8',
    })

    const arrayBuffer = new ArrayBuffer(8)
    const mockResponse = {
      ok: true,
      json: vi.fn(),
      arrayBuffer: vi.fn().mockResolvedValue(arrayBuffer),
      headers,
    }

    ;(fetch as vi.Mock).mockResolvedValue(mockResponse)

    const result = await generateImage(payload)
    expect(result.image).toBeTypeOf('string')
    expect(result.version).toBe('v2')
    expect(result.content_violation).toBe(false)
    expect(result.request_id).toBe('rid')
    expect(result.credits_used).toBe(2)
    expect(result.credits_remaining).toBe(8)
  })

  it('throws descriptive error when response is not ok', async () => {
    const payload = { prompt: 'hello', aspect_ratio: '3:2', version: 'latest' }

    const headers = new Headers({ 'X-Reve-Error-Code': 'RATE_LIMIT' })
    ;(fetch as vi.Mock).mockResolvedValue({
      ok: false,
      statusText: 'Too Many Requests',
      headers,
      json: vi.fn().mockResolvedValue({ message: 'Slow down' }),
    })

    await expect(generateImage(payload)).rejects.toThrow('RATE_LIMIT: Slow down')
  })
})
