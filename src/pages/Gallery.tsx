
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarDays, MapPin, Eye, Zap, Loader2 } from "lucide-react";

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
  ready: boolean | null;
}

// Local storage key for cached images
const LOCAL_IMAGES_KEY = 'historify_cached_images';

const Gallery = () => {
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
          console.warn('Supabase fetch error, falling back to local storage:', error);
          // Fall back to local storage
          const localImages = localStorage.getItem(LOCAL_IMAGES_KEY);
          return localImages ? JSON.parse(localImages) as Image[] : [];
        }
        
        console.log('Fetched images from Supabase:', data?.length || 0);
        return data as Image[];
      } catch (e) {
        console.warn('Error fetching from Supabase, falling back to local storage:', e);
        // Fall back to local storage
        const localImages = localStorage.getItem(LOCAL_IMAGES_KEY);
        return localImages ? JSON.parse(localImages) as Image[] : [];
      }
    },
    staleTime: 30000, // 30 seconds
    retry: false, // Don't retry on failure
  });

  // Filter out images that aren't ready yet
  const readyImages = images?.filter(image => image.ready) || [];

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Image Gallery</h1>
          <p className="text-muted-foreground">
            {readyImages.length} generated images • Click to view details
          </p>
        </div>

        {readyImages.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <Eye className="mx-auto h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No images yet</h3>
            <p className="text-muted-foreground">Generate your first image from the Prompts page!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {readyImages.map((image) => (
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
                              // Fallback to placeholder
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
