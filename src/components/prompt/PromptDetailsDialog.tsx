import * as React from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Edit3, Save, X, Loader2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedPrompt, setEditedPrompt] = React.useState(prompt);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Try to get user (optional; updates allowed publicly via RLS)
      let userId: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id ?? null;
      } catch (e) {
        console.warn('Auth check failed (continuing due to public policies):', e);
      }

      // Build update object with proper data type handling
      const updateData: any = {};
      
      // Handle string fields
      if (editedPrompt.title !== undefined && editedPrompt.title !== null) {
        updateData.title = String(editedPrompt.title).trim();
      }
      if (editedPrompt.description !== undefined && editedPrompt.description !== null) {
        updateData.description = String(editedPrompt.description).trim();
      }
      if (editedPrompt.prompt !== undefined && editedPrompt.prompt !== null) {
        updateData.prompt = String(editedPrompt.prompt).trim();
      }
      if (editedPrompt.country !== undefined && editedPrompt.country !== null) {
        updateData.country = String(editedPrompt.country).trim();
      }
      if (editedPrompt.theme !== undefined && editedPrompt.theme !== null) {
        updateData.theme = String(editedPrompt.theme).trim();
      }
      
      // Handle numeric fields
      if (editedPrompt.year !== undefined && editedPrompt.year !== null) {
        const yearNum = parseInt(String(editedPrompt.year), 10);
        if (!isNaN(yearNum)) updateData.year = yearNum;
      }
      if (editedPrompt.approx_people_count !== undefined && editedPrompt.approx_people_count !== null) {
        const peopleCount = parseInt(String(editedPrompt.approx_people_count), 10);
        if (!isNaN(peopleCount)) updateData.approx_people_count = peopleCount;
      }
      
      // Handle confidence field
      if (editedPrompt.confidence !== undefined && editedPrompt.confidence !== null) {
        const conf = parseInt(String(editedPrompt.confidence), 10);
        if (!isNaN(conf)) {
          // confidence is an integer with CHECK (0..100)
          updateData.confidence = Math.min(100, Math.max(0, conf));
        }
      }
      
      // Handle boolean fields (note: has_full_hints is a generated column and must NOT be updated)
      updateData.celebrity = Boolean(editedPrompt.celebrity);

      console.log('Attempting to update prompt with data:', updateData);
      console.log('User ID:', userId);
      console.log('Prompt ID:', prompt.id);

      // Check RLS policies by attempting a simple select first
      const { data: checkData, error: checkError } = await supabase
        .from('prompts')
        .select('id')
        .eq('id', prompt.id)
        .single();

      if (checkError) {
        console.error('Cannot access prompt for update:', checkError);
        throw new Error('Cannot access this prompt for editing. Please check your permissions.');
      }

      const { error, data } = await supabase
        .from('prompts')
        .update(updateData)
        .eq('id', prompt.id);

      if (error) {
        console.error('Supabase update error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          statusCode: error.statusCode
        });
        
        // Handle specific RLS errors
        if (error.code === 'PGRST301' || error.message.includes('JWT')) {
          throw new Error('Authentication required. Please sign in to edit prompts.');
        } else if (error.code === '42501' || error.message.includes('permission')) {
          throw new Error('Permission denied. You don\'t have permission to edit this prompt.');
        } else if (error.code === '23514') {
          throw new Error('Data validation failed. Please check your input values.');
        } else {
          throw new Error(`Update failed: ${error.message}`);
        }
      }
      
      console.log('Update successful:', data);

      toast({
        title: "Success",
        description: "Prompt updated successfully",
      });

      // Refresh queries so lists reflect the change
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['prompts-count'] });

      setIsEditing(false);
    } catch (err) {
      console.error('Update failed:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update prompt",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedPrompt(prompt);
    setIsEditing(false);
  };

  const handleChange = (field: string, value: any) => {
    setEditedPrompt(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing ? 'Edit Prompt' : prompt.title || 'Untitled Prompt'}
            </DialogTitle>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          <DialogDescription>
            {isEditing ? 'Edit prompt details below' : 'View prompt details'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {isEditing ? (
            <>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editedPrompt.title || ''}
                  onChange={(e) => handleChange('title', e.target.value || null)}
                  placeholder="Enter title..."
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editedPrompt.description || ''}
                  onChange={(e) => handleChange('description', e.target.value || null)}
                  placeholder="Enter description..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  value={editedPrompt.prompt}
                  onChange={(e) => handleChange('prompt', e.target.value)}
                  placeholder="Enter prompt..."
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={editedPrompt.country || ''}
                    onChange={(e) => handleChange('country', e.target.value || null)}
                    placeholder="Enter country..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={editedPrompt.year || ''}
                    onChange={(e) => handleChange('year', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Enter year..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Input
                    id="theme"
                    value={editedPrompt.theme || ''}
                    onChange={(e) => handleChange('theme', e.target.value || null)}
                    placeholder="Enter theme..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="confidence">Confidence</Label>
                  <Input
                    id="confidence"
                    type="number"
                    step="0.1"
                    value={editedPrompt.confidence || ''}
                    onChange={(e) => handleChange('confidence', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="Enter confidence..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="approx_people_count">Approx. People Count</Label>
                  <Input
                    id="approx_people_count"
                    type="number"
                    value={editedPrompt.approx_people_count || ''}
                    onChange={(e) => handleChange('approx_people_count', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Enter people count..."
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="celebrity"
                    checked={editedPrompt.celebrity || false}
                    onCheckedChange={(checked) => handleChange('celebrity', checked)}
                  />
                  <Label htmlFor="celebrity">Celebrity</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="has_full_hints"
                    checked={editedPrompt.has_full_hints || false}
                    onCheckedChange={(checked) => handleChange('has_full_hints', checked)}
                  />
                  <Label htmlFor="has_full_hints">Has Full Hints</Label>
                </div>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
        
        <DialogFooter className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
