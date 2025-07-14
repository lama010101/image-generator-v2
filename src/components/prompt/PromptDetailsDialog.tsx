import * as React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";

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

export const PromptDetailsDialog: React.FC<PromptDetailsDialogProps> = ({ trigger, prompt }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
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
          <div>
            <div className="font-semibold mb-1">Prompt</div>
            <div className="text-muted-foreground bg-muted p-3 rounded text-sm">{prompt.prompt}</div>
          </div>
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
