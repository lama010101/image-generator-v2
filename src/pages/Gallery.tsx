import { useState, useEffect, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FiltersPanel, { FiltersState } from "@/components/filters/FiltersPanel";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarDays, MapPin, Eye, Zap, Loader2, FileImage, Maximize2 } from "lucide-react";

interface Image {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  optimized_image_url: string | null;
  desktop_image_url?: string | null;
  mobile_image_url: string | null;
  thumbnail_image_url: string | null;
  country: string | null;
  year: number | null;
  model: string | null;
  created_at: string;
  prompt: string;
  width: number | null;
  height: number | null;
  cost: number | null;
  cfg_scale: number | null;
  steps: number | null;
  // Additional fields for filtering
  theme: string | null;
  approx_people_count: number | null;
  confidence: number | null;
  celebrity: boolean | null;
  real_event: boolean | null;
  has_full_hints: boolean | null;
  ready: boolean | null;
  aspect_ratio: string | null;
  accuracy_score: Record<string, any> | null;
  desktop_size_kb: number | null;
  original_size_kb: number | null;
  output_format: string | null;
  binary?: string | null;
}

const MODEL_NAME_MAP: Record<string, string> = {
  "bfl:1@1": "BFL FLUX1 Pro",
  "bfl:2@1": "BFL FLUX1.1 Pro",
  "bfl:2@2": "BFL FLUX1.1 Pro Ultra",
  "bfl:3@1": "BFL FLUX Kontext Pro",
  "bfl:4@1": "BFL FLUX Kontext Max",
  "runware:100@1": "Runware 100",
  "rundiffusion:130@100": "RunDiffusion 130",
  "fal-ai/imagen4/preview": "Imagen 4 (FAL)",
  "fal-ai/fast-sdxl": "Fast SDXL (FAL)",
  "fal-ai/sd-turbo": "SD Turbo (FAL)",
  "runware": "Runware",
};

const getModelDisplayName = (model?: string | null): string | null => {
  if (!model) return null;
  if (MODEL_NAME_MAP[model]) return MODEL_NAME_MAP[model];
  if (model.startsWith("reve:")) {
    const version = model.split(":")[1] ?? "";
    return `REVE ${version.toUpperCase()}`.trim();
  }
  return model;
};

const formatCostDisplay = (cost: number | null, model?: string | null): string => {
  if (cost === null || cost === undefined) return "—";
  if (isReveModel(model)) {
    const precision = Number.isInteger(cost) ? 0 : cost < 0.01 ? 4 : 2;
    const displayValue = cost.toFixed(precision);
    const numericValue = Number(displayValue);
    const isSingular = Math.abs(numericValue - 1) < Number.EPSILON;
    return `${displayValue} credit${isSingular ? '' : 's'}`;
  }
  const precision = cost < 0.01 ? 4 : 2;
  return `$${cost.toFixed(precision)}`;
};

const FALLBACK_IMAGE_URL = 'https://picsum.photos/400/400?random=fallback';
const FULLSCREEN_FALLBACK_URL = 'https://picsum.photos/800/600?random=fallback';

const getImageSource = (image: Image): string | null => {
  return image.optimized_image_url ?? null;
};

const isReveModel = (model?: string | null): boolean => !!model && model.startsWith('reve:');

const sortByCreatedAtDesc = (images: Image[]): Image[] =>
  [...images].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

// Local storage key for cached images
const LOCAL_IMAGES_KEY = 'historify_cached_images';

// Component to display image size information
const ImageSizeDisplay = ({ image }: { image: Image }) => {
  const originalSize = typeof image.original_size_kb === 'number' ? `${image.original_size_kb} KB` : null;
  const optimizedSize = typeof image.desktop_size_kb === 'number' ? `${image.desktop_size_kb} KB` : null;

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <FileImage className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Image Sizes:</span>
      </div>
      <div className="pl-6 space-y-1">
        {originalSize && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Original:</span>
            <span className="font-mono">{originalSize}</span>
          </div>
        )}
        {optimizedSize && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Optimized:</span>
            <span className="font-mono">{optimizedSize}</span>
          </div>
        )}
        {!originalSize && !optimizedSize && (
          <span className="text-muted-foreground text-sm">Size information not available</span>
        )}
      </div>
    </div>
  );
};

const Gallery = () => {
  const pageSizeOptions = [10, 25, 50, 100, 150, 200];
  const [filters, setFilters] = useState<FiltersState>({});
  const activeFilters = useMemo(() => filters, [filters]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(25);
  const [fullscreenImage, setFullscreenImage] = useState<Image | null>(null);

  // Query for total count of images matching filters
  const { data: totalCountData } = useQuery({
    queryKey: ['images-count', activeFilters],
    queryFn: async () => {
      let query = supabase
        .from('images')
        .select('*', { count: 'exact', head: true });
      if (activeFilters.theme) query = query.eq('theme', activeFilters.theme);
      if (activeFilters.location) query = query.eq('country', activeFilters.location);
      if (activeFilters.dateCreatedRange) {
        const [fromTs, toTs] = activeFilters.dateCreatedRange;
        query = query.gte('created_at', new Date(fromTs).toISOString()).lte('created_at', new Date(toTs).toISOString());
      }
      if (activeFilters.numberPeopleRange) {
        const [minP, maxP] = activeFilters.numberPeopleRange;
        query = query.gte('approx_people_count', minP).lte('approx_people_count', maxP);
      }
      if (activeFilters.confidenceRange) {
        const [minC, maxC] = activeFilters.confidenceRange;
        query = query.gte('confidence', minC).lte('confidence', maxC);
      }
      if (activeFilters.celebrityOnly) query = query.eq('celebrity', true);
      if (activeFilters.realEventStatus === 'true') query = query.eq('real_event', true);
      else if (activeFilters.realEventStatus === 'fictional') query = query.eq('real_event', false);
      if (activeFilters.hasFullHints) query = query.eq('has_full_hints', true);
      if (activeFilters.readyStatus === 'ready') query = query.eq('ready', true);
      else if (activeFilters.readyStatus === 'not_ready') query = query.eq('ready', false);
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30000,
    retry: false,
  });

  const { data: images, isLoading, error } = useQuery({
    queryKey: ['images', page, pageSize, activeFilters],
    queryFn: async () => {
      console.log('Fetching images from database with filters...');
      try {
        const primaryColumns = [
          'id',
          'title',
          'description',
          'optimized_image_url',
          'country',
          'year',
          'model',
          'created_at',
          'prompt',
          'width',
          'height',
          'cost',
          'cfg_scale',
          'steps',
          'theme',
          'approx_people_count',
          'confidence',
          'celebrity',
          'real_event',
          'has_full_hints',
          'ready',
          'aspect_ratio',
          'desktop_size_kb',
          'original_size_kb',
          'output_format',
        ].join(',');
        const fallbackColumns = [
          'id',
          'title',
          'description',
          'optimized_image_url',
          'created_at',
          'ready',
          'prompt',
          'model',
          'cost',
          'output_format',
        ].join(',');

        const rangeStart = page * pageSize;
        const rangeEnd = (page + 1) * pageSize - 1;

        const applyFilters = (query: any) => {
          let filteredQuery = query;
          if (activeFilters.theme) {
            filteredQuery = filteredQuery.eq('theme', activeFilters.theme);
          }
          if (activeFilters.location) {
            filteredQuery = filteredQuery.eq('country', activeFilters.location);
          }
          if (activeFilters.dateCreatedRange) {
            const [fromTs, toTs] = activeFilters.dateCreatedRange;
            filteredQuery = filteredQuery
              .gte('created_at', new Date(fromTs).toISOString())
              .lte('created_at', new Date(toTs).toISOString());
          }
          if (activeFilters.numberPeopleRange) {
            const [minP, maxP] = activeFilters.numberPeopleRange;
            filteredQuery = filteredQuery
              .gte('approx_people_count', minP)
              .lte('approx_people_count', maxP);
          }
          if (activeFilters.confidenceRange) {
            const [minC, maxC] = activeFilters.confidenceRange;
            filteredQuery = filteredQuery
              .gte('confidence', minC)
              .lte('confidence', maxC);
          }
          if (activeFilters.celebrityOnly) {
            filteredQuery = filteredQuery.eq('celebrity', true);
          }
          if (activeFilters.realEventStatus === 'true') {
            filteredQuery = filteredQuery.eq('real_event', true);
          } else if (activeFilters.realEventStatus === 'fictional') {
            filteredQuery = filteredQuery.eq('real_event', false);
          }
          if (activeFilters.hasFullHints) {
            filteredQuery = filteredQuery.eq('has_full_hints', true);
          }
          if (activeFilters.readyStatus === 'ready') {
            filteredQuery = filteredQuery.eq('ready', true);
          } else if (activeFilters.readyStatus === 'not_ready') {
            filteredQuery = filteredQuery.eq('ready', false);
          }
          return filteredQuery;
        };

        const buildQuery = (columns: string, withOrder: boolean) => {
          let q = supabase.from('images').select(columns);
          q = applyFilters(q);
          if (withOrder) {
            q = q.order('created_at', { ascending: false });
          }
          return q.range(rangeStart, rangeEnd).returns<Image[]>();
        };

        console.log('Gallery fetch columns:', primaryColumns);
        console.log('Gallery fetch range:', rangeStart, rangeEnd);

        const { data, error } = await buildQuery(primaryColumns, true);
        if (error) {
          console.warn('Supabase fetch error:', error);
          if ((error as { code?: string })?.code === '57014') {
            console.warn('Timeout when ordering by created_at. Retrying without order...');
            const { data: fallbackData, error: fallbackError } = await buildQuery(fallbackColumns, false);
            if (fallbackError) {
              console.warn('Fallback fetch error:', fallbackError);
              throw new Error('Failed to fetch images – Supabase unavailable');
            }
            console.log('Fetched images from Supabase (fallback):', fallbackData?.length || 0);
            return sortByCreatedAtDesc(fallbackData ?? []);
          }
          throw new Error('Failed to fetch images – Supabase unavailable');
        }
        console.log('Fetched images from Supabase:', data?.length || 0);
        return sortByCreatedAtDesc(data ?? []);
      } catch (e) {
        console.error('Error fetching from Supabase:', e);
        throw e;
      }
    },
    staleTime: 30000, // 30 seconds
    retry: false, // Don't retry on failure
  });

    // No longer filter out by ready status
  // Filtering now handled in Supabase query
const countsEnabled = typeof totalCountData === 'number';
const filteredImages = images || [];

  // Bulk actions for selected images
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected images?`)) return;
    const { error } = await supabase
      .from('images')
      .delete()
      .in('id', selectedIds);

    if (error) {
      console.error('Delete error:', error);
      return;
    }

    setSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: ['images'] });
  };

  const handleToggleReady = async () => {
    if (selectedIds.length === 0) return;
    const selectedImages = images?.filter(img => selectedIds.includes(img.id)) || [];
    const updatePromises = selectedImages.map(img =>
      supabase.from('images').update({ ready: !img.ready }).eq('id', img.id)
    );
    await Promise.all(updatePromises);
    queryClient.invalidateQueries({ queryKey: ['images'] });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load gallery</p>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Total count display */}
        {countsEnabled && (
          <div className="mb-4 text-sm text-muted-foreground">
            Total images: {typeof totalCountData === 'number' ? totalCountData : '...'}
          </div>
        )}
        {/* Filters Panel */}
        <FiltersPanel
          state={filters}
          onChange={setFilters}
          onClear={() => setFilters({})}
          themeOptions={[...(images?.map(i=>i.theme).filter(Boolean) as string[]).filter((v,i,a)=>a.indexOf(v)===i)]}
          locationOptions={[...(images?.map(i=>i.country).filter(Boolean) as string[]).filter((v,i,a)=>a.indexOf(v)===i)]}
        />
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          {/* Pagination controls */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>Prev</Button>
            <span className="text-sm">Page {page+1}</span>
            <Button variant="outline" size="sm" disabled={images && images.length < pageSize} onClick={()=>setPage(p=>p+1)}>Next</Button>
            <Select value={pageSize.toString()} onValueChange={v=>{setPageSize(parseInt(v)); setPage(0);}}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(opt=><SelectItem key={opt} value={opt.toString()}>{opt}/page</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Image Gallery</h1>
            <p className="text-muted-foreground">
              {filteredImages.length} generated images • Click to view details
            </p>
          </div>

        </div>

        {/* Selection Toolbar */}
        {filteredImages.length > 0 && (
          <div className="flex items-center gap-4 mb-4">
            <Checkbox
              checked={selectedIds.length === filteredImages.length && filteredImages.length > 0}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedIds(filteredImages.map((img) => img.id));
                } else {
                  setSelectedIds([]);
                }
              }}
            />
            <span className="text-sm">Select All</span>
            {selectedIds.length > 0 && (
              <>
                <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
                  Delete Selected ({selectedIds.length})
                </Button>
                <Button size="sm" onClick={handleToggleReady}>
                  Toggle Ready
                </Button>
              </>
            )}
          </div>
        )}

        {filteredImages.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <Eye className="mx-auto h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No images yet</h3>
            <p className="text-muted-foreground">Generate your first image from the Prompts page!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredImages.map((image) => {
              const imageSrc = getImageSource(image);
              return (
                <Dialog key={image.id}>
                  <DialogTrigger asChild>
                    <Card className="cursor-pointer hover:shadow-lg transition-all group relative">
                      <CardContent className="p-0">
                        <Checkbox
                          checked={selectedIds.includes(image.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedIds((prev) => [...prev, image.id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== image.id));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-2 left-2 z-10 bg-background/80 rounded"
                        />
                        {/* Ready/Not Ready Tag */}
                        <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-2">
                          {image.ready ? (
                            <Badge className="bg-green-500 text-white">Ready</Badge>
                          ) : (
                            <Badge className="bg-red-500 text-white">Not Ready</Badge>
                          )}
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(event) => {
                              event.stopPropagation();
                              setFullscreenImage(image);
                            }}
                            title="View fullscreen"
                          >
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={image.title || 'Generated image'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                console.error('Image failed to load:', image.id);
                                (e.target as HTMLImageElement).src = FALLBACK_IMAGE_URL;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Zap className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-sm line-clamp-2 mb-2">
                            {image.title || 'Untitled'}
                          </h3>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {new Date(image.created_at).toLocaleDateString()}
                            </div>
                            {image.model && (
                              <Badge variant="outline" className="text-xs">
                                {getModelDisplayName(image.model) ?? image.model}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-end justify-between text-xs">
                            <div className="text-sm font-semibold text-foreground">
                              {formatCostDisplay(image.cost, image.model)}
                            </div>
                            {image.model && (
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {image.model}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{image.title || 'Untitled Image'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={image.title || 'Generated image'}
                            className="w-full rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = FULLSCREEN_FALLBACK_URL;
                            }}
                          />
                        ) : (
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <Zap className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-4">
                        {image.description && (
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">{image.description}</p>
                          </div>
                        )}

                        <div>
                          <h4 className="font-semibold mb-2">Prompt</h4>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">{image.prompt}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="flex items-center gap-1 font-medium">
                              <MapPin className="h-4 w-4" />
                              Location
                            </div>
                            <p className="text-muted-foreground">{image.country ?? 'Not specified'}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 font-medium">
                              <CalendarDays className="h-4 w-4" />
                              Year
                            </div>
                            <p className="text-muted-foreground">{image.year ?? 'Not specified'}</p>
                          </div>
                          <div className="col-span-2">
                            <div className="border-t border-border pt-4">
                              <ImageSizeDisplay image={image} />
                            </div>
                          </div>
                          {image.width && image.height ? (
                            <div>
                              <div className="font-medium">Dimensions</div>
                              <p className="text-muted-foreground">{image.width} × {image.height}</p>
                            </div>
                          ) : null}
                          {image.model ? (
                            <div>
                              <div className="font-medium">Model</div>
                              <p className="text-muted-foreground">{image.model}</p>
                            </div>
                          ) : null}
                          {image.output_format && (
                            <div>
                              <div className="font-medium">Format</div>
                              <p className="text-muted-foreground">{image.output_format.toUpperCase()}</p>
                            </div>
                          )}
                          {typeof image.cfg_scale === 'number' && (
                            <div>
                              <div className="font-medium">CFG Scale</div>
                              <p className="text-muted-foreground">{image.cfg_scale}</p>
                            </div>
                          )}
                          {typeof image.steps === 'number' && (
                            <div>
                              <div className="font-medium">Steps</div>
                              <p className="text-muted-foreground">{image.steps}</p>
                            </div>
                          )}
                          {image.aspect_ratio && (
                            <div>
                              <div className="font-medium">Aspect Ratio</div>
                              <p className="text-muted-foreground">{image.aspect_ratio}</p>
                            </div>
                          )}
                          {image.cost !== null && (
                            <div>
                              <div className="font-medium">{isReveModel(image.model) ? 'Credits' : 'Cost'}</div>
                              <p className="text-muted-foreground">{formatCostDisplay(image.cost, image.model)}</p>
                            </div>
                          )}
                        </div>

                        {image.accuracy_score?.source === 'reve' && (
                          <div className="border border-dashed border-border rounded-lg p-4 space-y-2">
                            <h4 className="font-semibold text-sm">REVE Details</h4>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <div className="font-medium">Request ID</div>
                                <p className="text-muted-foreground">{image.accuracy_score.request_id ?? '—'}</p>
                              </div>
                              <div>
                                <div className="font-medium">Credits Used</div>
                                <p className="text-muted-foreground">{image.cost ?? image.accuracy_score.credits_used ?? '—'}</p>
                              </div>
                              <div>
                                <div className="font-medium">Credits Remaining</div>
                                <p className="text-muted-foreground">{image.accuracy_score.credits_remaining ?? '—'}</p>
                              </div>
                              <div>
                                <div className="font-medium">Source</div>
                                <p className="text-muted-foreground">{image.accuracy_score.source}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(image.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        )}
      </div>
      <Dialog
        open={!!fullscreenImage}
        onOpenChange={(open) => {
          if (!open) setFullscreenImage(null);
        }}
      >
        <DialogContent className="sm:max-w-[95vw] bg-black/90 border-0 p-0">
          {fullscreenImage && (
            <div className="flex items-center justify-center">
              <img
                src={getImageSource(fullscreenImage) ?? FULLSCREEN_FALLBACK_URL}
                alt={fullscreenImage.title || 'Fullscreen image'}
                className="h-[90vh] w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FULLSCREEN_FALLBACK_URL;
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Gallery;
