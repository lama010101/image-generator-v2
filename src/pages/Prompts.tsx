
import { useState, useMemo } from "react";
import FiltersPanel, { FiltersState } from "@/components/filters/FiltersPanel";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Search, Sparkles, MapPin, Calendar, Loader2 } from "lucide-react";
import { GenerationSettingsPanel } from "@/components/generate/GenerationSettingsPanel";
import { useToast } from "@/hooks/use-toast";
import { generateImage } from "@/services/imageGeneration";
import { PromptDetailsDialog } from "@/components/prompt/PromptDetailsDialog";

interface Prompt {
  id: string;
  title: string | null;
  description: string | null;
  prompt: string;
  country: string | null;
  year: number | null;
  has_full_hints: boolean | null;
  celebrity: boolean | null;
  approx_people_count: number | null;
  confidence: number | null;
  theme: string | null;
  used: boolean | null;
  real_event: boolean | null;
  images?: { id: string }[]; // joined images to infer usage
}

interface GenerationSettings {
  model: string;
  steps: number;
  cfgScale: number;
  width: number;
  height: number;
  imageType: 'webp' | 'png' | 'jpg';
}

const defaultSettings: GenerationSettings = {
  model: "runware:100@1", // default Runware model (valid)
  steps: 20,
  cfgScale: 2,
  width: 1024,
  height: 1024,
  imageType: "webp",
};

const Prompts = () => {
  const pageSizeOptions = [10, 25, 50, 100, 150, 200];
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState<number>(0);
  const [filters, setFilters] = useState<FiltersState>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
    const [generationSettings, setGenerationSettings] =
    useState<GenerationSettings>(defaultSettings);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch total count of prompts matching filters
  const { data: totalCountData } = useQuery({
    queryKey: ['prompts-count', filters, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true });
      if (searchTerm) query = query.ilike('title', `%${searchTerm}%`);
      if (filters.theme) query = query.eq('theme', filters.theme);
      if (filters.location) query = query.eq('country', filters.location);
      if (filters.dateCreatedRange) {
        const [fromTs, toTs] = filters.dateCreatedRange;
        query = query.gte('created_at', new Date(fromTs).toISOString()).lte('created_at', new Date(toTs).toISOString());
      }
      if (filters.numberPeopleRange) {
        const [minP, maxP] = filters.numberPeopleRange;
        query = query.gte('approx_people_count', minP).lte('approx_people_count', maxP);
      }
      if (filters.confidenceRange) {
        const [minC, maxC] = filters.confidenceRange;
        query = query.gte('confidence', minC).lte('confidence', maxC);
      }
      if (filters.celebrityOnly) query = query.eq('celebrity', true);
      if (filters.trueEventOnly) query = query.eq('real_event', true);
      if (filters.hasFullHints) query = query.eq('has_full_hints', true);
      if (filters.usedStatus === 'used') query = query.eq('used', true);
      else if (filters.usedStatus === 'unused') query = query.is('used', null);
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30000,
    retry: false,
  });

  const { data: prompts, isLoading, error } = useQuery({
    queryKey: ['prompts', page, pageSize, filters, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('prompts')
        .select('id, title, description, prompt, country, year, has_full_hints, confidence, theme, celebrity, approx_people_count, used, real_event, images(id)')
        .order('created_at', { ascending: false });
      if (searchTerm) query = query.ilike('title', `%${searchTerm}%`);
      if (filters.theme) query = query.eq('theme', filters.theme);
      if (filters.location) query = query.eq('country', filters.location);
      if (filters.dateCreatedRange) {
        const [fromTs, toTs] = filters.dateCreatedRange;
        query = query.gte('created_at', new Date(fromTs).toISOString()).lte('created_at', new Date(toTs).toISOString());
      }
      if (filters.numberPeopleRange) {
        const [minP, maxP] = filters.numberPeopleRange;
        query = query.gte('approx_people_count', minP).lte('approx_people_count', maxP);
      }
      if (filters.confidenceRange) {
        const [minC, maxC] = filters.confidenceRange;
        query = query.gte('confidence', minC).lte('confidence', maxC);
      }
      if (filters.celebrityOnly) query = query.eq('celebrity', true);
      if (filters.trueEventOnly) query = query.eq('real_event', true);
      if (filters.hasFullHints) query = query.eq('has_full_hints', true);
      if (filters.usedStatus === 'used') query = query.eq('used', true);
      else if (filters.usedStatus === 'unused') query = query.is('used', null);
      query = query.range(page * pageSize, (page + 1) * pageSize - 1);
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching prompts:', error);
        throw error;
      }
      return data as Prompt[];
    },
    staleTime: 30000,
    retry: false,
  });

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filteredPrompts.map(p => p.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleGenerateSelected = async () => {
    if (selectedIds.size === 0) return;
    setBulkGenerating(true);
    // Sequential generation to avoid API throttling
    for (const prompt of filteredPrompts.filter(p => selectedIds.has(p.id))) {
      // eslint-disable-next-line no-await-in-loop
      await handleGenerate(prompt, generationSettings);
    }
    setBulkGenerating(false);
    clearSelection();
  };

  // Log the current state for debugging
  console.log('Prompts query state:', { isLoading, error, promptsCount: prompts?.length });

  const filteredPrompts = prompts || [];

  const toggleRealEvent = async (prompt: Prompt, isRealEvent: boolean) => {
    console.log('Toggling real_event:', { promptId: prompt.id, currentValue: prompt.real_event, newValue: isRealEvent });
    
    try {
      const { data, error } = await supabase
        .from('prompts')
        .update({ real_event: isRealEvent })
        .eq('id', prompt.id)
        .select()
        .single();
      
      console.log('Update response:', { data, error });
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      // Update the local state to reflect the change
      queryClient.setQueryData(
        ['prompts', page, pageSize, filters, searchTerm],
        (oldData: Prompt[] | undefined) => {
          const newData = oldData?.map(p => 
            p.id === prompt.id ? { ...p, real_event: isRealEvent } : p
          );
          console.log('Updated local state:', newData?.find(p => p.id === prompt.id));
          return newData;
        }
      );
      
      toast({
        title: isRealEvent ? "Marked as Real Event" : "Marked as Not a Real Event",
        description: isRealEvent 
          ? "This prompt is now marked as a real event" 
          : "This prompt is no longer marked as a real event"
      });
    } catch (error) {
      console.error('Error updating prompt status:', error);
      toast({
        title: "Update Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleGenerate = async (prompt: Prompt, settings: GenerationSettings) => {
    setGeneratingId(prompt.id);
    
    toast({
      title: "Generation Started",
      description: `Generating image for: ${prompt.title || 'Untitled prompt'}`,
    });

    try {
      const result = await generateImage({
        promptId: prompt.id,
        prompt: prompt.prompt,
        title: prompt.title || undefined,
        description: prompt.description || undefined,
        negative_prompt: (prompt as any).negative_prompt || undefined,
        model: settings.model,
        steps: settings.steps,
        cfgScale: settings.cfgScale,
        width: settings.width,
        height: settings.height,
        imageType: settings.imageType,
      });

      if (result.success) {
        toast({
          title: "Generation Complete",
          description: "Image has been generated and saved to gallery",
        });
        
        // Invalidate the images query to refresh the gallery
        queryClient.invalidateQueries({ queryKey: ['images'] });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "There was an error generating the image",
        variant: "destructive",
      });
    } finally {
      setGeneratingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading prompts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load prompts</p>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Prompt Library</h1>
          <p className="text-muted-foreground">
            {totalCountData ?? '...'} prompts available • Select a prompt to generate an image
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left column for filters and settings */}
          <div className="w-full md:w-[350px] flex-shrink-0">
            <div className="space-y-6 sticky top-6">
              <FiltersPanel
                state={filters}
                onChange={setFilters}
                onClear={() => setFilters({})}
                themeOptions={[...new Set(prompts?.map(p => p.theme).filter(Boolean) as string[])]}
                locationOptions={[...new Set(prompts?.map(p => p.country).filter(Boolean) as string[])]}
              />
              <GenerationSettingsPanel
                settings={generationSettings}
                onSettingsChange={setGenerationSettings}
              />
            </div>
          </div>

          {/* Right column for prompts grid */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              {/* Pagination & Page size */}
              <div className="flex items-center gap-4 mb-2 sm:mb-0">
                <Button variant="outline" size="sm" disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>Prev</Button>
                <span className="text-sm">Page {page+1} of {totalCountData && pageSize ? Math.max(1, Math.ceil(totalCountData / pageSize)) : '...'}</span>
<input
  type="number"
  min={1}
  max={totalCountData && pageSize ? Math.max(1, Math.ceil(totalCountData / pageSize)) : 1}
  value={page+1}
  onChange={e => {
    let val = Number(e.target.value);
    if (!isNaN(val) && val >= 1 && totalCountData && pageSize && val <= Math.ceil(totalCountData / pageSize)) {
      setPage(val-1);
    }
  }}
  className="w-16 px-2 py-1 border rounded text-sm ml-2"
  style={{width:'60px'}}
/>

                <Button variant="outline" size="sm" disabled={prompts && prompts.length < pageSize} onClick={()=>setPage(p=>p+1)}>Next</Button>
                <Select value={pageSize.toString()} onValueChange={v=>{setPageSize(parseInt(v)); setPage(0);}}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map(opt=> <SelectItem key={opt} value={opt.toString()}>{opt}/page</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search prompts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="secondary" size="sm" onClick={selectAllFiltered} disabled={filteredPrompts.length === 0}>Select All</Button>
                  <Button variant="secondary" size="sm" onClick={clearSelection} disabled={selectedIds.size === 0}>Clear</Button>
                  <Button size="sm" onClick={handleGenerateSelected} disabled={selectedIds.size === 0 || bulkGenerating}>
                      {bulkGenerating ? (
                          <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating ({selectedIds.size})
                          </>
                      ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate ({selectedIds.size})
                          </>
                      )}
                  </Button>
              </div>
            </div>

            {!filteredPrompts || filteredPrompts.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">
                  {searchTerm ? "No prompts found matching your search." : "No prompts available."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPrompts.map((prompt) => (
                  <PromptDetailsDialog
                    key={prompt.id}
                    prompt={prompt}
                    trigger={
                      <div
                        style={{ cursor: "pointer" }}
                        onClick={e => {
                          const target = e.target as HTMLElement;
                          if (target.closest("button") || target.closest("input[type='checkbox']")) {
                            e.preventDefault();
                            return;
                          }
                        }}
                      >
                        <Card className="hover:shadow-lg transition-shadow relative group h-full flex flex-col">
                          <Checkbox
                            className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm"
                            checked={selectedIds.has(prompt.id)}
                            onCheckedChange={() => toggleSelect(prompt.id)}
                            onClick={e => e.stopPropagation()}
                          />
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg line-clamp-2">
                                  {prompt.title || 'Untitled Prompt'}
                                </CardTitle>
                                {prompt.description && (
                                  <CardDescription className="mt-2 line-clamp-3">
                                    {prompt.description}
                                  </CardDescription>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`real-event-${prompt.id}`}
                                    checked={!!prompt.real_event}
                                    onCheckedChange={(checked) => toggleRealEvent(prompt, checked)}
                                    className="data-[state=checked]:bg-green-500"
                                  />
                                  <Label htmlFor={`real-event-${prompt.id}`} className="text-xs">
                                    {prompt.real_event ? 'Real Event' : 'Not Real'}
                                  </Label>
                                </div>
                                {(prompt.used || (prompt.images && prompt.images.length > 0)) && (
                                  <Badge variant="success" className="shrink-0">
                                    Used
                                  </Badge>
                                )}
                                {prompt.has_full_hints && (
                                  <Badge variant="secondary" className="shrink-0">
                                    Complete
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="flex-1 flex flex-col justify-between">
                            <p className="text-sm text-muted-foreground line-clamp-3 bg-muted p-2 rounded mb-4">
                              {prompt.prompt}
                            </p>
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-2 text-xs">
                                {prompt.country && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {prompt.country}
                                  </div>
                                )}
                                {prompt.year && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {prompt.year}
                                  </div>
                                )}
                                {prompt.theme && (
                                  <Badge variant="outline" className="text-xs">
                                    {prompt.theme}
                                  </Badge>
                                )}
                              </div>
                              <Button
                                onClick={e => { e.stopPropagation(); handleGenerate(prompt, generationSettings); }}
                                disabled={generatingId === prompt.id}
                                className="w-full"
                              >
                                {generatingId === prompt.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate Image
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prompts;
