export type GenerationPayload = {
  prompt: string
  aspect_ratio: string
  version: string
}

export type GenerationResult = {
  image: string
  version: string
  content_violation: boolean
  request_id: string
  credits_used: number
  credits_remaining: number
}

export type DisplayResult = GenerationResult & {
  httpStatus: number
  createdAt: string
  payload: GenerationPayload
  id: string
}
