import React, { useState, useEffect, useCallback } from 'react';
import { useImageGeneration } from './useImageGeneration';
import { getSafeSettings } from './settings-service';
import type { GenerationSettings } from './types';

interface PromptGeneratorProps {
  selectedPromptIds: string[];
  onGenerationComplete: (imageId: string) => void;
}

export default function PromptGenerator({ selectedPromptIds, onGenerationComplete }: PromptGeneratorProps) {
  const [settings, setSettings] = useState<GenerationSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { generateImage, isGenerating, progress, result } = useImageGeneration(selectedPromptIds.length);

  useEffect(() => {
    getSafeSettings()
      .then(setSettings)
      .catch(e => setError('Failed to load settings'));
  }, []);

  const updateSettings = (newSettings: Partial<GenerationSettings>) => {
    if (!settings) return;
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    // In a real app, you would likely persist these settings.
  };

  const handleGenerate = async () => {
    if (!settings || selectedPromptIds.length === 0) return;
    setError(null);

    const concurrency = 3;
    let index = 0;
    const results: Promise<void>[] = [];

    const next = async () => {
      if (index >= selectedPromptIds.length) return;
      const promptId = selectedPromptIds[index++];
      try {
        const imageId = await generateImage(promptId, settings, index -1);
        if (imageId) onGenerationComplete(imageId);
      } catch (e: any) { // Type annotation added
        setError(`Error generating image for prompt ${promptId}: ${e.message || e}`);
      }
      await next();
    };

    for (let i = 0; i < concurrency; i++) results.push(next());
    await Promise.all(results);
  };

  if (!settings) return <div>Loading settings...</div>;

  return (
    <div className="p-4 border rounded-lg">
      <select
        className="w-full p-2 border rounded"
        value={settings.model}
        onChange={e => updateSettings({ model: e.target.value as GenerationSettings['model'] })}
      >
        <option value="RunDiffusion_130">RunDiffusion 130</option>
        <option value="Imagen_4">Imagen 4</option>
      </select>
      {/* ...other fields... */}
      <button
        className="w-full bg-blue-600 text-white py-2 rounded font-medium"
        onClick={handleGenerate}
        disabled={isGenerating || selectedPromptIds.length === 0}
      >
        {isGenerating ? `Generating... (${progress}%)` : `Generate ${selectedPromptIds.length} Image(s)`}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {result && <div className="text-green-600 mt-2">Generated: {result}</div>}
    </div>
  );
}
