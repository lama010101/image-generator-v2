
import { useState, useMemo } from "react";
import FiltersPanel, { FiltersState } from "@/components/filters/FiltersPanel";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
}

interface GenerationSettings {
  model: string;
  steps: number;
  cfgScale: number;
  width: number;
  height: number;
}

const defaultSettings: GenerationSettings = {
  model: "runware:100@1", // default Runware model (valid)
  steps: 20,
  cfgScale: 2,
  width: 1024,
  height: 1024,
};

const Prompts = () => {
  const [filters, setFilters] = useState<FiltersState>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
    const [generationSettings, setGenerationSettings] =
    useState<GenerationSettings>(defaultSettings);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: prompts, isLoading, error } = useQuery({
    queryKey: ['prompts'],
    queryFn: async () => {
      console.log('Fetching prompts from database...');
      const { data, error } = await supabase
        .from('prompts')
        .select('id, title, description, prompt, country, year, has_full_hints, confidence, theme, celebrity, approx_people_count')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching prompts:', error);
        throw error;
      }
      
      console.log('Fetched prompts:', data?.length || 0);
      return data as Prompt[];
    }
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

  const filteredPrompts = useMemo(() => {
    if (!prompts) return [];
    return prompts.filter(prompt => {
      // Search term filter (existing)
      const matchesSearch =
        prompt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.prompt.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Theme filter
      if (filters.theme && (prompt.theme?.toLowerCase() ?? "") !== filters.theme.toLowerCase()) return false;

      // Location filter (country)
      if (filters.location && (prompt.country?.toLowerCase() ?? "") !== filters.location.toLowerCase()) return false;

      // Celebrity Only
      if (filters.celebrityOnly && !prompt.celebrity) return false

      // Date created range
      if (filters.dateCreatedRange && prompt.year) {
        const [fromTs, toTs] = filters.dateCreatedRange;
        const promptTime = new Date(`${prompt.year}-01-01`).getTime();
        if (promptTime < fromTs || promptTime > toTs) return false;
      }

      // Number of people range
      if (filters.numberPeopleRange && prompt.approx_people_count !== null) {
        const [minP, maxP] = filters.numberPeopleRange;
        if (prompt.approx_people_count < minP || prompt.approx_people_count > maxP) return false;
      }

      // Confidence range
      if (filters.confidenceRange) {
        const [minC, maxC] = filters.confidenceRange;
        const conf = prompt.confidence ?? 0;
        if (conf < minC || conf > maxC) return false;
      }

      // True event only
      if (filters.trueEventOnly && !prompt.title) {
        // Placeholder, assume all prompts are true event for now
      }

      // Has full hints
      if (filters.hasFullHints && !prompt.has_full_hints) return false;

      return true;
    });
  }, [prompts, searchTerm, filters]);

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
            {prompts?.length || 0} prompts available • Select a prompt to generate an image
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
                              {prompt.has_full_hints && (
                                <Badge variant="secondary" className="ml-2 shrink-0">
                                  Complete
                                </Badge>
                              )}
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
