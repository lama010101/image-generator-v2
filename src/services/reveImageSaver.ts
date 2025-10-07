import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

export interface ReveSaveParams {
  imageBase64: string
  prompt: string
  aspectRatio: string
  version: string
  requestId?: string
  creditsUsed?: number
  creditsRemaining?: number
  title?: string | null
  description?: string | null
}

export interface ReveSaveResult {
  success: boolean
  imageId?: string
  error?: string
}

const IMAGE_FORMAT: 'png' | 'jpg' | 'webp' = 'png'

const mimeTypeForFormat = (format: 'png' | 'jpg' | 'webp') => {
  switch (format) {
    case 'jpg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    default:
      return 'image/png'
  }
}

const base64ToBlob = (base64: string, format: 'png' | 'jpg' | 'webp'): Blob => {
  if (!base64) throw new Error('No image data provided')

  if (typeof atob === 'function') {
    const binaryString = atob(base64)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new Blob([bytes], { type: mimeTypeForFormat(format) })
  }

  if (typeof Buffer !== 'undefined') {
    const buffer = Buffer.from(base64, 'base64')
    return new Blob([buffer], { type: mimeTypeForFormat(format) })
  }

  throw new Error('Base64 decoding is not supported in this environment')
}

const createImageId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `reve-${Date.now()}-${Math.random().toString(16).slice(2)}`

const blobToDataUrl = async (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Unexpected FileReader result type'))
        return
      }
      resolve(result)
    }
    reader.readAsDataURL(blob)
  })

export const saveReveImage = async (params: ReveSaveParams): Promise<ReveSaveResult> => {
  try {
    const {
      imageBase64,
      prompt,
      aspectRatio,
      version,
      requestId,
      creditsUsed,
      creditsRemaining,
      title,
      description,
    } = params

    if (!prompt.trim()) {
      throw new Error('Prompt is required to save the image')
    }

    const imageId = createImageId()
    const imageBlob = base64ToBlob(imageBase64, IMAGE_FORMAT)

    const { generateMultiFormatVariants } = await import('@/services/imageFormatService')

    const variants = await generateMultiFormatVariants(imageBlob, IMAGE_FORMAT)

    const [originalDataUrl, desktopDataUrl, mobileDataUrl, thumbnailDataUrl] = await Promise.all([
      blobToDataUrl(variants.original),
      blobToDataUrl(variants.desktop.blob),
      blobToDataUrl(variants.mobile.blob),
      blobToDataUrl(variants.thumbnail.blob),
    ])

    const binaryData = originalDataUrl

    const imageRecord: Record<string, any> = {
      id: imageId,
      prompt,
      title: title?.trim() || `REVE image ${requestId || imageId}`,
      description: description ?? null,
      aspect_ratio: aspectRatio,
      binary: binaryData,
      desktop_size_kb: Math.round(variants.desktop.size / 1024),
      mobile_size_kb: Math.round(variants.mobile.size / 1024),
      original_size_kb: Math.round(variants.originalSize / 1024),
      width: variants.desktop.width,
      height: variants.desktop.height,
      output_format: IMAGE_FORMAT,
      cost: typeof creditsUsed === 'number' ? creditsUsed : undefined,
      accuracy_score: {
        request_id: requestId ?? null,
        credits_remaining: creditsRemaining ?? null,
        source: 'reve',
      },
      source_citation: 'REVE API',
      negative_prompt: null,
      prompt_id: null,
      cfg_scale: null,
      steps: null,
      model: `reve:${version}`,
      ready: true,
      ai_generated: true,
    }

    const sanitizedRecord = Object.fromEntries(
      Object.entries(imageRecord).filter(([, value]) => value !== undefined && value !== null),
    )

    type ImageInsert = Database['public']['Tables']['images']['Insert']

    const supabasePayload: ImageInsert = {
      ...(sanitizedRecord as ImageInsert),
    }

    const { data, error } = await supabase
      .from('images')
      .insert(supabasePayload)
      .select('id')
      .single()

    if (error) {
      throw error
    }

    return {
      success: true,
      imageId: data?.id ?? imageId,
    }
  } catch (error) {
    console.error('Failed to save REVE image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred while saving image',
    }
  }
}
