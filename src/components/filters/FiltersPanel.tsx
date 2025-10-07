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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  realEventStatus?: 'all' | 'true' | 'fictional';
  hasFullHints?: boolean;
  readyStatus?: 'all' | 'ready' | 'not_ready';
  usedStatus?: 'all' | 'used' | 'unused';
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

  // Local slider states to avoid spamming queries while dragging
  const [localDateRange, setLocalDateRange] = React.useState<[number, number]>(
    state.dateCreatedRange ?? [1577836800000, Date.now()]
  );
  const [localPeopleRange, setLocalPeopleRange] = React.useState<[number, number]>(
    state.numberPeopleRange ?? [0, 100]
  );
  const [localConfidenceRange, setLocalConfidenceRange] = React.useState<[number, number]>(
    state.confidenceRange ?? [0, 100]
  );

  // Sync local states if external state changes elsewhere
  React.useEffect(() => {
    if (state.dateCreatedRange) setLocalDateRange(state.dateCreatedRange);
  }, [state.dateCreatedRange]);
  React.useEffect(() => {
    if (state.numberPeopleRange) setLocalPeopleRange(state.numberPeopleRange);
  }, [state.numberPeopleRange]);
  React.useEffect(() => {
    if (state.confidenceRange) setLocalConfidenceRange(state.confidenceRange);
  }, [state.confidenceRange]);

  // Control the accordion to keep it open across re-renders (collapsed by default)
  const [accordionValue, setAccordionValue] = React.useState<string>('');

  return (
    <Card className="mb-6 w-full max-w-sm">
      <CardHeader className="p-0">
        <Accordion
          type="single"
          collapsible
          value={accordionValue}
          onValueChange={(val) => setAccordionValue(val ?? '')}
        >
          <AccordionItem value="filters" className="border-0">
            <AccordionTrigger className="px-4">Filters</AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {/* Ready Status Filter (for images) */}
              <div className="mb-4">
                <Label className="mb-2 block text-sm font-medium">Ready</Label>
                <RadioGroup
                  value={state.readyStatus ?? 'all'}
                  onValueChange={(val) => update({ readyStatus: val as 'all' | 'ready' | 'not_ready' })}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="ready-all" />
                    <Label htmlFor="ready-all">All</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ready" id="ready-true" />
                    <Label htmlFor="ready-true">Ready</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="not_ready" id="ready-false" />
                    <Label htmlFor="ready-false">Not Ready</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Used Status Filter (for prompts) */}
              <div className="mb-4">
                <Label className="mb-2 block text-sm font-medium">Used</Label>
                <RadioGroup
                  value={state.usedStatus ?? 'all'}
                  onValueChange={(val) => update({ usedStatus: val as 'all' | 'used' | 'unused' })}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="used-all" />
                    <Label htmlFor="used-all">All</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="used" id="used-true" />
                    <Label htmlFor="used-true">Used</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unused" id="used-false" />
                    <Label htmlFor="used-false">Not Used</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="mb-4">
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
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>
                    {localDateRange
                      ? `${new Date(localDateRange[0]).toLocaleDateString()} - ${new Date(localDateRange[1]).toLocaleDateString()}`
                      : `${new Date(1577836800000).toLocaleDateString()} - ${new Date(Date.now()).toLocaleDateString()}`}
                  </span>
                </div>
                <Slider
                  min={1577836800000} // 1 Jan 2020
                  max={Date.now()}
                  step={24 * 60 * 60 * 1000}
                  value={localDateRange}
                  onValueChange={(val) => setLocalDateRange(val as [number, number])}
                  onValueCommit={(val) => update({ dateCreatedRange: val as [number, number] })}
                />
              </div>

              {/* Number of People Range */}
              <div className="mb-4">
                <Label className="mb-2 block text-sm font-medium">Number of People</Label>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>
                    {localPeopleRange
                      ? `${localPeopleRange[0]} - ${localPeopleRange[1]}`
                      : `0 - 100`}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={localPeopleRange}
                  onValueChange={(val) => setLocalPeopleRange(val as [number, number])}
                  onValueCommit={(val) => {
                    const clamped = [
                      Math.max(0, Math.min(100, val[0] as number)),
                      Math.max(0, Math.min(100, val[1] as number))
                    ];
                    update({ numberPeopleRange: clamped as [number, number] });
                  }}
                />
              </div>

              {/* Confidence Level (range) */}
              <div className="mb-6">
                <Label className="mb-2 block text-sm font-medium">Confidence Level</Label>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>
                    {localConfidenceRange
                      ? `${localConfidenceRange[0]}% - ${localConfidenceRange[1]}%`
                      : `0% - 100%`}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={localConfidenceRange}
                  onValueChange={(val) => setLocalConfidenceRange(val as [number, number])}
                  onValueCommit={(val) => update({ confidenceRange: val as [number, number] })}
                />
              </div>

              {/* True Event tri-state */}
              <div className="mb-4">
                <Label className="mb-2 block text-sm font-medium">True Event</Label>
                <RadioGroup
                  value={state.realEventStatus ?? 'all'}
                  onValueChange={(val) => update({ realEventStatus: val as 'all' | 'true' | 'fictional' })}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="real-all" />
                    <Label htmlFor="real-all">All</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="real-true" />
                    <Label htmlFor="real-true">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fictional" id="real-fictional" />
                    <Label htmlFor="real-fictional">Fictional</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Has Full Hints toggle */}
              <div className="flex items-center justify-between mb-6">
                <Label className="text-sm">Has Full Hints</Label>
                <Switch
                  checked={!!state.hasFullHints}
                  onCheckedChange={(checked) => update({ hasFullHints: !!checked })}
                />
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
