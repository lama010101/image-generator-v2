import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface FiltersState {
  theme?: string;
  location?: string;
  celebrityOnly?: boolean;
  /** Date created range [from, to] (timestamps in ms) */
  dateCreatedRange?: [number, number];
  /** Approximate number of people range [min, max] */
  numberPeopleRange?: [number, number];
  /** Confidence range [min, max] */
  confidenceRange?: [number, number];
  trueEventOnly?: boolean;
  hasFullHints?: boolean;
}

interface FiltersPanelProps {
  state: FiltersState;
  onChange: (newState: FiltersState) => void;
  onClear?: () => void;
  themeOptions?: string[];
  locationOptions?: string[];
}

const FiltersPanel: React.FC<FiltersPanelProps> = ({
  state,
  onChange,
  onClear,
  themeOptions = [],
  locationOptions = [],
}) => {
  const ALL_VALUE = "__ALL__";

  const update = (partial: Partial<FiltersState>) => {
    onChange({ ...state, ...partial });
  };

  return (
    <Card className="mb-6 w-full max-w-sm">
      <CardHeader className="p-0">
        <Accordion type="single" collapsible defaultValue="filters">
          <AccordionItem value="filters" className="border-0">
            <AccordionTrigger className="px-4">Filters</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {/* Theme & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="mb-1 block text-sm font-medium">Filter by Theme</Label>
                  <Select
                    value={state.theme ?? ALL_VALUE}
                    onValueChange={(val) => update({ theme: val === ALL_VALUE ? undefined : val })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select theme..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>All</SelectItem>
                      {themeOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1 block text-sm font-medium">Filter by Location</Label>
                  <Select
                    value={state.location ?? ALL_VALUE}
                    onValueChange={(val) => update({ location: val === ALL_VALUE ? undefined : val })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select location..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL_VALUE}>All</SelectItem>
                      {locationOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Celebrity Only */}
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="celebrity-only"
                  checked={!!state.celebrityOnly}
                  onCheckedChange={(checked) => update({ celebrityOnly: !!checked })}
                />
                <Label htmlFor="celebrity-only" className="text-sm">
                  Celebrity Only
                </Label>
              </div>

              {/* Date Created Range */}
              <div className="mb-6">
                <Label className="mb-2 block text-sm font-medium">Date Created Range</Label>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>1/1/2020</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <Slider
                  min={1577836800000} // 1 Jan 2020
                  max={Date.now()}
                  step={24 * 60 * 60 * 1000}
                  value={state.dateCreatedRange ?? [1577836800000, Date.now()]}
                  onValueChange={(val) => update({ dateCreatedRange: val as [number, number] })}
                />
              </div>

              {/* Number of People (range) */}
              <div className="mb-6">
                <Label className="mb-2 block text-sm font-medium">Number of People</Label>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>0 people</span>
                  <span>20+ people</span>
                </div>
                <Slider
                  min={0}
                  max={20}
                  step={1}
                  value={state.numberPeopleRange ?? [0, 20]}
                  onValueChange={(val) => update({ numberPeopleRange: val as [number, number] })}
                />
              </div>

              {/* Confidence Level (range) */}
              <div className="mb-6">
                <Label className="mb-2 block text-sm font-medium">Confidence Level</Label>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={state.confidenceRange ?? [0, 100]}
                  onValueChange={(val) => update({ confidenceRange: val as [number, number] })}
                />
              </div>

              {/* Toggles */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">True Event Only</Label>
                  <Switch
                    checked={!!state.trueEventOnly}
                    onCheckedChange={(checked) => update({ trueEventOnly: !!checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Has Full Hints</Label>
                  <Switch
                    checked={!!state.hasFullHints}
                    onCheckedChange={(checked) => update({ hasFullHints: !!checked })}
                  />
                </div>
              </div>

              {onClear && (
                <Button variant="outline" className="w-full" onClick={onClear}>
                  Clear All Filters
                </Button>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardHeader>
    </Card>
  );
};

export default FiltersPanel;
