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
import { CalendarDays, MapPin, Eye, Zap, Loader2, FileImage } from "lucide-react";
import { formatFileSize, getImageSize, ImageSizeInfo } from "@/utils/imageUtils";

interface Image {
  id: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  optimized_image_url: string | null;
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
}

// Local storage key for cached images
const LOCAL_IMAGES_KEY = 'historify_cached_images';

// Component to display image size information
const ImageSizeDisplay = ({ image }: { image: Image }) => {
  const [sizes, setSizes] = useState<ImageSizeInfo>({ originalSize: null, optimizedSize: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSizes = async () => {
      try {
        setIsLoading(true);
        const [originalSize, optimizedSize] = await Promise.all([
          image.image_url ? getImageSize(image.image_url) : Promise.resolve(null),
          image.optimized_image_url ? getImageSize(image.optimized_image_url) : Promise.resolve(null)
        ]);
        
        setSizes({
          originalSize: originalSize ? formatFileSize(originalSize) : null,
          optimizedSize: optimizedSize ? formatFileSize(optimizedSize) : null
        });
      } catch (error) {
        console.error('Error fetching image sizes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSizes();
  }, [image.image_url, image.optimized_image_url]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading sizes...
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <FileImage className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">Image Sizes:</span>
      </div>
      <div className="pl-6 space-y-1">
        {sizes.originalSize && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Original:</span>
            <span className="font-mono">{sizes.originalSize}</span>
          </div>
        )}
        {sizes.optimizedSize && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Optimized:</span>
            <span className="font-mono">{sizes.optimizedSize}</span>
          </div>
        )}
        {!sizes.originalSize && !sizes.optimizedSize && (
          <span className="text-muted-foreground text-sm">Size information not available</span>
        )}
      </div>
    </div>
  );
};

const Gallery = () => {
  const pageSizeOptions = [10, 25, 50, 100, 150, 200];
  const [filters, setFilters] = useState<FiltersState>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(25);

  // Query for total count of images matching filters
  const { data: totalCountData } = useQuery({
    queryKey: ['images-count', filters],
    queryFn: async () => {
      let query = supabase
        .from('images')
        .select('*', { count: 'exact', head: true });
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
      if (filters.readyStatus === 'ready') query = query.eq('ready', true);
      else if (filters.readyStatus === 'not_ready') query = query.eq('ready', false);
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30000,
    retry: false,
  });

  const { data: images, isLoading, error } = useQuery({
    queryKey: ['images', page, pageSize, filters],
    queryFn: async () => {
      console.log('Fetching images from database with filters...');
      try {
        let query = supabase
          .from('images')
          .select('*')
          .order('created_at', { ascending: false });

        // Theme filter
        if (filters.theme) {
          query = query.eq('theme', filters.theme);
        }
        // Location filter (country)
        if (filters.location) {
          query = query.eq('country', filters.location);
        }
        // Date created range
        if (filters.dateCreatedRange) {
          const [fromTs, toTs] = filters.dateCreatedRange;
          query = query.gte('created_at', new Date(fromTs).toISOString()).lte('created_at', new Date(toTs).toISOString());
        }
        // Number of people range
        if (filters.numberPeopleRange) {
          const [minP, maxP] = filters.numberPeopleRange;
          query = query.gte('approx_people_count', minP).lte('approx_people_count', maxP);
        }
        // Confidence range
        if (filters.confidenceRange) {
          const [minC, maxC] = filters.confidenceRange;
          query = query.gte('confidence', minC).lte('confidence', maxC);
        }
        // Celebrity only
        if (filters.celebrityOnly) {
          query = query.eq('celebrity', true);
        }
        // True event only
        if (filters.trueEventOnly) {
          query = query.eq('real_event', true);
        }
        // Has full hints
        if (filters.hasFullHints) {
          query = query.eq('has_full_hints', true);
        }
        // Ready status
        if (filters.readyStatus === 'ready') {
          query = query.eq('ready', true);
        } else if (filters.readyStatus === 'not_ready') {
          query = query.eq('ready', false);
        }
        // Pagination
        query = query.range(page * pageSize, (page + 1) * pageSize - 1);

        const { data, error } = await query;
        if (error) {
          console.warn('Supabase fetch error:', error);
          throw new Error('Failed to fetch images – Supabase unavailable');
        }
        console.log('Fetched images from Supabase:', data?.length || 0);
        return data as Image[];
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
        <div className="mb-4 text-sm text-muted-foreground">
          Total images: {typeof totalCountData === 'number' ? totalCountData : '...'}
        </div>
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
            {filteredImages.map((image) => (
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
                      <div className="absolute top-2 right-2 z-10">
                        {image.ready ? (
                          <Badge className="bg-green-500 text-white">Ready</Badge>
                        ) : (
                          <Badge className="bg-red-500 text-white">Not Ready</Badge>
                        )}
                      </div>
                      <div className="aspect-square bg-muted rounded-t-lg overflow-hidden">
                        {image.optimized_image_url || image.image_url ? (
                          <img
                            src={image.optimized_image_url || image.image_url || ''}
                            alt={image.title || 'Generated image'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              console.error('Image failed to load:', image.id);
                              (e.target as HTMLImageElement).src = 'https://picsum.photos/400/400?random=fallback';
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
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(image.created_at).toLocaleDateString()}
                          </div>
                          {image.model && (
                            <Badge variant="outline" className="text-xs">
                              {image.model}
                            </Badge>
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
                      {image.optimized_image_url || image.image_url ? (
                        <img
                          src={image.optimized_image_url || image.image_url || ''}
                          alt={image.title || 'Generated image'}
                          className="w-full rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://picsum.photos/800/600?random=fallback';
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
                        {image.country && (
                          <div>
                            <div className="flex items-center gap-1 font-medium">
                              <MapPin className="h-4 w-4" />
                              Location
                            </div>
                            <p className="text-muted-foreground">{image.country}</p>
                          </div>
                        )}
                        {image.year && (
                          <div>
                            <div className="flex items-center gap-1 font-medium">
                              <CalendarDays className="h-4 w-4" />
                              Year
                            </div>
                            <p className="text-muted-foreground">{image.year}</p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <div className="border-t border-border pt-4">
                            <ImageSizeDisplay image={image} />
                          </div>
                        </div>
                        {image.width && image.height && (
                          <div>
                            <div className="font-medium">Dimensions</div>
                            <p className="text-muted-foreground">{image.width} × {image.height}</p>
                          </div>
                        )}
                        {image.model && (
                          <div>
                            <div className="font-medium">Model</div>
                            <p className="text-muted-foreground">{image.model}</p>
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
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(image.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
