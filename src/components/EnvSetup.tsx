
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const EnvSetup = () => {
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const envTemplate = `# Runware (VITE) Configuration
VITE_RUNWARE_API_KEY=your_runware_api_key_here

# OpenRouter Configuration  
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Fireworks Service Configuration
FIREWORKS_API_KEY=your_fireworks_api_key_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
FIREBASE_APP_ID=your_firebase_app_id_here`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envTemplate);
    toast({
      title: "Copied to clipboard",
      description: "Environment template has been copied to your clipboard",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-orange-800">Environment Setup Required</CardTitle>
          </div>
          <CardDescription className="text-orange-700">
            To enable real image generation, you need to create a .env.local file with your API keys.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Environment Template</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="h-8"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
            <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
              {envTemplate}
            </pre>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Setup Instructions:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Create a file named <code className="bg-gray-100 px-1 rounded">.env.local</code> in your project root</li>
              <li>Copy the template above and paste it into the file</li>
              <li>Replace the placeholder values with your actual API keys</li>
              <li>Restart your development server</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">API Providers:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <a href="https://runware.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Runware API</a> - Image generation</li>
                <li>• <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenRouter</a> - LLM proxy</li>
                <li>• <a href="https://fireworks.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Fireworks AI</a> - Fast inference</li>
                <li>• <a href="https://platform.openai.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI</a> - GPT models</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Infrastructure:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Supabase</a> - Database & auth</li>
                <li>• <a href="https://firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Firebase</a> - File storage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-800">Demo Mode Active</CardTitle>
          </div>
          <CardDescription>
            The app is currently running in demo mode with placeholder images. 
            Configure your API keys above to enable real image generation.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};
