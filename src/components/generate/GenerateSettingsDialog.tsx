import React, { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Settings {
  model: string;
  steps: number;
  cfgScale: number;
  width: number;
  height: number;
}

interface GenerateSettingsDialogProps {
  initial: Settings;
  onSave: (settings: Settings) => void;
}

const defaultModels = [
  { label: "Runware 100", value: "runware:100@1" },
  { label: "RunDiffusion 130", value: "rundiffusion:130@100" },
  { label: "Imagen 4 (FAL)", value: "fal-ai/imagen4/preview" },
  { label: "Fast SDXL (FAL)", value: "fal-ai/fast-sdxl" },
  { label: "SD Turbo (FAL)", value: "fal-ai/sd-turbo" },
];

export const GenerateSettingsDialog: React.FC<GenerateSettingsDialogProps> = ({ initial, onSave }) => {
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState(initial.model);
  const [steps, setSteps] = useState(initial.steps);
  const [cfgScale, setCfgScale] = useState(initial.cfgScale);
  const [width, setWidth] = useState(initial.width);
  const [height, setHeight] = useState(initial.height);

  const handleSave = () => {
    onSave({ model, steps, cfgScale, width, height });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Settings</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generation Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={setModel}>
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
            <Label htmlFor="steps">Steps: {steps}</Label>
            <Slider
              id="steps"
              min={1}
              max={50}
              step={1}
              value={[steps]}
              onValueChange={(val) => setSteps(val[0])}
            />
          </div>

          {/* CFG Scale */}
          <div className="space-y-2">
            <Label htmlFor="cfg">CFG Scale: {cfgScale}</Label>
            <Slider
              id="cfg"
              min={1}
              max={30}
              step={0.5}
              value={[cfgScale]}
              onValueChange={(val) => setCfgScale(val[0])}
            />
          </div>

          {/* Width & Height */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
