import { useState, useEffect, useMemo } from "react";
import FiltersPanel, { FiltersState } from "@/components/filters/FiltersPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [filters, setFilters] = useState<FiltersState>({});
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const { data: images, isLoading, error } = useQuery({
    queryKey: ['images', page],
    queryFn: async () => {
      console.log('Fetching images from database...');
      
      try {
        // Try to get from Supabase first
        const { data, error } = await supabase
          .from('images')
          .select('*')
          .order('created_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
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

  // Filter out images that aren't ready yet
  const readyImages = images?.filter(image => image.ready) || [];

  const filteredImages = useMemo(() => {
    return readyImages.filter(image => {
      // Theme filter
      if (filters.theme && (image.theme?.toLowerCase() ?? "") !== filters.theme.toLowerCase()) return false;

      // Location filter (country)
      if (filters.location && (image.country?.toLowerCase() ?? "") !== filters.location.toLowerCase()) return false;

      // Date created range
      if (filters.dateCreatedRange) {
        const [fromTs, toTs] = filters.dateCreatedRange;
        const createdTs = new Date(image.created_at).getTime();
        if (createdTs < fromTs || createdTs > toTs) return false;
      }

      // Number of people range
      if (filters.numberPeopleRange && image.approx_people_count !== null) {
        const [minP, maxP] = filters.numberPeopleRange;
        if (image.approx_people_count < minP || image.approx_people_count > maxP) return false;
      }

      // Confidence range
      if (filters.confidenceRange && image.confidence !== null) {
        const [minC, maxC] = filters.confidenceRange;
        if (image.confidence < minC || image.confidence > maxC) return false;
      }

      // Celebrity only
      if (filters.celebrityOnly && !image.celebrity) return false;

      // True event only (real_event column)
      if (filters.trueEventOnly && !image.real_event) return false;

      // Has full hints
      if (filters.hasFullHints && !image.has_full_hints) return false;

      return true;
    });
  }, [readyImages, filters]);

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
        {/* Filters Panel */}
        <FiltersPanel
          state={filters}
          onChange={setFilters}
          onClear={() => setFilters({})}
          themeOptions={[...(images?.map(i=>i.theme).filter(Boolean) as string[]).filter((v,i,a)=>a.indexOf(v)===i)]}
          locationOptions={[...(images?.map(i=>i.country).filter(Boolean) as string[]).filter((v,i,a)=>a.indexOf(v)===i)]}
        />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Image Gallery</h1>
          <p className="text-muted-foreground">
            {filteredImages.length} generated images • Click to view details
          </p>
        </div>

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
                  <Card className="cursor-pointer hover:shadow-lg transition-all group">
                    <CardContent className="p-0">
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
