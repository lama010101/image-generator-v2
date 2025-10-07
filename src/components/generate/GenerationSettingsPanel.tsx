import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// It might be better to move this to a shared types file later.
export interface GenerationSettings {
  model: string;
  steps: number;
  cfgScale: number;
  width: number;
  height: number;
  imageType: 'webp' | 'png' | 'jpg';
}

interface GenerationSettingsPanelProps {
  settings: GenerationSettings;
  onSettingsChange: (newSettings: GenerationSettings) => void;
}

const defaultModels = [
  { label: "BFL FLUX.1 Pro (Text-to-Image)", value: "bfl:1@1" },
  { label: "BFL FLUX.1.1 Pro (Text-to-Image)", value: "bfl:2@1" },
  { label: "BFL FLUX.1.1 Pro Ultra (Hi-Res Text-to-Image)", value: "bfl:2@2" },
  { label: "BFL FLUX Kontext Pro", value: "bfl:3@1" },
  { label: "BFL FLUX Kontext Max", value: "bfl:4@1" },
  { label: "Runware 100", value: "runware:100@1" },
  { label: "RunDiffusion 130", value: "rundiffusion:130@100" },
  { label: "Imagen 4 (FAL)", value: "fal-ai/imagen4/preview" },
  { label: "Fast SDXL (FAL)", value: "fal-ai/fast-sdxl" },
  { label: "SD Turbo (FAL)", value: "fal-ai/sd-turbo" },
];

const modelPresets: Record<string, Partial<GenerationSettings>> = {
  "bfl:1@1": { width: 1024, height: 1024, steps: 40, cfgScale: 2.5 },
  "bfl:2@1": { width: 1280, height: 720 },
  "bfl:2@2": { width: 2752, height: 1536 },
  "bfl:3@1": { width: 1392, height: 752 },
  "bfl:4@1": { width: 1024, height: 1024 },
};

const DEFAULT_WIDTH = 576;
const DEFAULT_HEIGHT = 1344;
const DEFAULT_IMAGE_TYPE: GenerationSettings['imageType'] = 'webp';

export const GenerationSettingsPanel: React.FC<GenerationSettingsPanelProps> = ({ settings, onSettingsChange }) => {

  const update = (partial: Partial<GenerationSettings>) => {
    onSettingsChange({ ...settings, ...partial });
  };

  const handleModelChange = (val: string) => {
    const preset = modelPresets[val];
    if (preset) {
      onSettingsChange({
        ...settings,
        ...preset,
        model: val,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        imageType: DEFAULT_IMAGE_TYPE,
      });
    } else {
      onSettingsChange({
        ...settings,
        model: val,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        imageType: DEFAULT_IMAGE_TYPE,
      });
    }
  };

  const [accordionValue, setAccordionValue] = React.useState<string>('settings');

  return (
    <Card className="mb-6 w-full max-w-sm">
      <CardHeader className="p-0">
        <Accordion
          type="single"
          collapsible
          value={accordionValue}
          onValueChange={(val) => setAccordionValue(val ?? '')}
        >
          <AccordionItem value="settings" className="border-0">
            <AccordionTrigger className="px-4">Generation Settings</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                {/* Model */}
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select value={settings.model} onValueChange={handleModelChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultModels.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Steps */}
                <div className="space-y-2">
                  <Label htmlFor="steps">Steps: {settings.steps}</Label>
                  <Slider
                    id="steps"
                    min={1}
                    max={50}
                    step={1}
                    value={[settings.steps]}
                    onValueChange={(val) => update({ steps: val[0] })}
                  />
                </div>

                {/* CFG Scale */}
                <div className="space-y-2">
                  <Label htmlFor="cfg">CFG Scale: {settings.cfgScale}</Label>
                  <Slider
                    id="cfg"
                    min={1}
                    max={30}
                    step={0.5}
                    value={[settings.cfgScale]}
                    onValueChange={(val) => update({ cfgScale: val[0] })}
                  />
                </div>

                {/* Width & Height */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">Width</Label>
                    <Input
                      id="width"
                      type="number"
                      value={settings.width}
                      onChange={(e) => update({ width: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      type="number"
                      value={settings.height}
                      onChange={(e) => update({ height: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                </div>

                {/* Image Type */}
                <div className="space-y-2">
                  <Label htmlFor="imageType">Image Format</Label>
                  <Select value={settings.imageType} onValueChange={(val) => update({ imageType: val as 'webp' | 'png' | 'jpg' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webp">WebP (default)</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardHeader>
    </Card>
  );
};
