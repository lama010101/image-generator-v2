import { z } from 'zod'

const reveSchema = z.object({
  apiKey: z.string().min(1, 'Missing VITE_REVE_API_KEY'),
  apiBase: z.string().url('Invalid VITE_REVE_API_BASE'),
  endpointPath: z.string().min(1, 'Missing VITE_REVE_ENDPOINT_PATH'),
  accept: z.string().min(1, 'Missing VITE_REVE_ACCEPT').default('application/json'),
})

const legacySchema = z.object({
  VITE_RUNWARE_API_KEY: z.string().optional(),
  VITE_FAL_API_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
})

export type Settings = z.infer<typeof legacySchema>

export const settings: Settings = legacySchema.parse(import.meta.env)

export const getReveConfig = () => {
  const config = reveSchema.safeParse({
    apiKey: import.meta.env.VITE_REVE_API_KEY,
    apiBase: import.meta.env.VITE_REVE_API_BASE ?? 'https://api.reve.com',
    endpointPath: import.meta.env.VITE_REVE_ENDPOINT_PATH ?? '/v1/image/create',
    accept: (import.meta.env.VITE_REVE_ACCEPT ?? 'application/json').toLowerCase(),
  })

  if (!config.success) {
    if (import.meta.env.PROD) throw config.error
    console.error(config.error)
  }

  return config.data
}
