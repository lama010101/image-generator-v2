import { z } from "zod";

/**
 * Runtime-safe access to Vite environment variables.
 * Use `settings.<key>` instead of touching `import.meta.env` directly.
 */
const schema = z.object({
  VITE_RUNWARE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
});

export type Settings = z.infer<typeof schema>;

export const settings: Settings = schema.parse(import.meta.env);
