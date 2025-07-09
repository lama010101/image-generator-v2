
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, MapPin, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateImage } from "@/services/imageGeneration";

interface Prompt {
  id: string;
  title: string | null;
  description: string | null;
  prompt: string;
  country: string | null;
  year: number | null;
  has_full_hints: boolean | null;
  confidence: number | null;
  theme: string | null;
}

const Prompts = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: prompts, isLoading, error } = useQuery({
    queryKey: ['prompts'],
    queryFn: async () => {
      console.log('Fetching prompts from database...');
      const { data, error } = await supabase
        .from('prompts')
        .select('id, title, description, prompt, country, year, has_full_hints, confidence, theme')
        .limit(100)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching prompts:', error);
        throw error;
      }
      
      console.log('Fetched prompts:', data?.length || 0);
      return data as Prompt[];
    }
  });

  // Log the current state for debugging
  console.log('Prompts query state:', { isLoading, error, promptsCount: prompts?.length });

  const filteredPrompts = prompts?.filter(prompt =>
    prompt.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.prompt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerate = async (prompt: Prompt) => {
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

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {!filteredPrompts || filteredPrompts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm ? "No prompts found matching your search." : "No prompts available."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <Card key={prompt.id} className="hover:shadow-lg transition-shadow">
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
                      <Badge variant="secondary" className="ml-2">
                        Complete
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2 bg-muted p-2 rounded">
                      {prompt.prompt}
                    </p>
                    
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
                      onClick={() => handleGenerate(prompt)}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Prompts;
