import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { generateImageFromPrompt } from './ai-providers-service';
import { optimizeImage } from './image-optimizer';
import { uploadToFirebase } from './storage-service';
import { saveImageMetadata } from './image-upload-service';
import { generationSettingsSchema } from './types';

// Placeholder for Supabase admin client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const bodySchema = z.object({
  prompt_id: z.string().uuid(),
  settings: generationSettingsSchema
});
type RequestBody = z.infer<typeof bodySchema>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  // CSRF check is good practice but simplified here

  let body: RequestBody;
  try {
    body = bodySchema.parse(req.body);
  } catch (e) {
    return res.status(400).json({ error: 'Malformed request body', details: (e as Error).message });
  }

  // Auth check is good practice but simplified here

  try {
    const { data: prompt, error: pErr } = await supabase
      .from('prompts')
      .select('*')
      .eq('id', body.prompt_id)
      .single();

    if (pErr || !prompt) return res.status(404).json({ error: 'Prompt not found' });

    const raw = await generateImageFromPrompt(
      prompt.positive_prompt ?? prompt.description,
      prompt.negative_prompt ?? '',
      body.settings
    );
    const buf = await optimizeImage(raw, body.settings.outputFormat);

    const id = uuidv4();
    const urls = await Promise.all([
      uploadToFirebase(`original/${id}.${body.settings.outputFormat}`,  buf.originalBuffer),
      uploadToFirebase(`desktop/${id}.${body.settings.outputFormat}`,   buf.desktopBuffer ),
      uploadToFirebase(`mobile/${id}.${body.settings.outputFormat}`,    buf.mobileBuffer  ),
      uploadToFirebase(`thumb/${id}.${body.settings.outputFormat}`,     buf.thumbnailBuffer)
    ]);

    const meta = {
      title: prompt.title ?? 'Untitled',
      description: prompt.description ?? '',
      image_url: urls[0],
      desktop_image_url: urls[1],
      mobile_image_url: urls[2],
      thumbnail_image_url: urls[3],
      ...body.settings,
      prompt_id: body.prompt_id,
      ai_generated: true,
    };

    const { data: saved, error: sErr } = await saveImageMetadata(meta);
    if (sErr) throw sErr;

    res.status(200).json({ success: true, imageId: saved.id, urls: {
      original: urls[0], desktop: urls[1], mobile: urls[2], thumbnail: urls[3]
    } });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: 'Internal error', details: e.message });
  }
}
