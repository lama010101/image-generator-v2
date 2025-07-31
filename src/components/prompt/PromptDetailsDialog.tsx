import * as React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import EditableImageMetadata from "./EditableImageMetadata";
import { MapPin, Calendar } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface PromptDetailsDialogProps {
  trigger: React.ReactNode;
  prompt: {
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
    [key: string]: any;
  };
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const PromptDetailsDialog: React.FC<PromptDetailsDialogProps> = ({ trigger, prompt }) => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchImages() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("images")
        .select("*")
        .eq("prompt_id", prompt.id);
      if (!mounted) return;
      if (error) {
        setError(error.message);
        setImages([]);
      } else {
        setImages(data || []);
      }
      setLoading(false);
    }
    if (prompt?.id) fetchImages();
    return () => { mounted = false; };
  }, [prompt?.id]);
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{prompt.title || 'Untitled Prompt'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {prompt.description && (
            <div>
              <div className="font-semibold mb-1">Description</div>
              <div className="text-muted-foreground text-sm">{prompt.description}</div>
            </div>
          )}
          <Accordion type="single" collapsible defaultValue="">
            <AccordionItem value="prompt">
              <AccordionTrigger className="font-semibold">Prompt</AccordionTrigger>
              <AccordionContent>
                <div className="text-muted-foreground bg-muted p-3 rounded text-sm">{prompt.prompt}</div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* IMAGE METADATA SECTION */}
          <div className="py-4">
            <div className="font-semibold mb-2">Image Metadata</div>
            {loading && <div className="text-muted-foreground text-sm">Loading image metadata...</div>}
            {error && <div className="text-destructive text-sm">{error}</div>}
            {!loading && !error && images.length === 0 && (
              <div className="text-muted-foreground text-sm">No images found for this prompt.</div>
            )}
            {images.map((img, idx) => (
              <EditableImageMetadata
                key={img.id || idx}
                image={img}
                onSave={async (newData) => {
                  // Save newData to DB
                  try {
                    const { error } = await supabase
                      .from("images")
                      .update(newData)
                      .eq("id", img.id);
                    if (error) throw error;
                    // Refetch images after save
                    const { data } = await supabase
                      .from("images")
                      .select("*")
                      .eq("prompt_id", prompt.id);
                    setImages(data || []);
                  } catch (e) {
                    alert("Failed to save: " + (e instanceof Error ? e.message : String(e)));
                  }
                }}
              />
            ))}
          </div>

          {/* ORIGINAL PROMPT SUMMARY CARDS (unchanged) */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {prompt.country && (
              <div>
                <div className="flex items-center gap-1 font-medium">
                  <MapPin className="h-4 w-4" />
                  Location
                </div>
                <div className="text-muted-foreground">{prompt.country}</div>
              </div>
            )}
            {prompt.year && (
              <div>
                <div className="flex items-center gap-1 font-medium">
                  <Calendar className="h-4 w-4" />
                  Year
                </div>
                <div className="text-muted-foreground">{prompt.year}</div>
              </div>
            )}
            {typeof prompt.celebrity === 'boolean' && (
              <div>
                <div className="font-medium">Celebrity</div>
                <div className="text-muted-foreground">{prompt.celebrity ? 'Yes' : 'No'}</div>
              </div>
            )}
            {typeof prompt.approx_people_count === 'number' && (
              <div>
                <div className="font-medium">Approx. People Count</div>
                <div className="text-muted-foreground">{prompt.approx_people_count}</div>
              </div>
            )}
            {typeof prompt.confidence === 'number' && (
              <div>
                <div className="font-medium">Confidence</div>
                <div className="text-muted-foreground">{prompt.confidence}</div>
              </div>
            )}
            {prompt.theme && (
              <div>
                <div className="font-medium">Theme</div>
                <div className="text-muted-foreground">{prompt.theme}</div>
              </div>
            )}
            {typeof prompt.has_full_hints === 'boolean' && (
              <div>
                <div className="font-medium">Has Full Hints</div>
                <div className="text-muted-foreground">{prompt.has_full_hints ? 'Yes' : 'No'}</div>
              </div>
            )}
            <div className="col-span-2">
              <div className="border-t border-border pt-4 text-xs text-muted-foreground">
                ID: {prompt.id}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <button className="mt-4 px-4 py-2 rounded bg-secondary text-secondary-foreground hover:bg-secondary/80">Close</button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
