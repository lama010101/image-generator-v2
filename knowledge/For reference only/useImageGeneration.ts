import { useRef, useState } from 'react';
import type { GenerationSettings } from './types';

export function useImageGeneration(total = 1, timeoutMs = 60_000) {
  const [isGenerating, setGen] = useState(false);
  const [progress, setProg] = useState(0);
  const [error, setErr] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);

  async function generate(promptId: string, settings: GenerationSettings, index: number) {
    setErr(null);
    setGen(true);
    setProg(Math.round((index / total) * 100));

    controller.current = new AbortController();
    const t = setTimeout(() => controller.current?.abort(), timeoutMs);

    try {
      const r = await fetch('/api/generate', { // This endpoint would need to be implemented
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt_id: promptId, settings }),
        signal: controller.current.signal
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Generation failed');
      setProg(Math.round(((index + 1) / total) * 100));
      return data.imageId as string;
    } catch (e: any) {
      setErr(e.message);
      return null;
    } finally {
      clearTimeout(t);
      if (index + 1 === total) setGen(false);
    }
  }

  return { generate, isGenerating: isGenerating, progress, error };
}
