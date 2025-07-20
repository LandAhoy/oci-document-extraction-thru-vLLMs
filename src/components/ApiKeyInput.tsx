import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Key } from "lucide-react";

interface ApiKeyInputProps {
  onApiKeySet: () => void;
}

export const ApiKeyInput = ({ onApiKeySet }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your OpenRouter API key",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey.startsWith("sk-or-v1-")) {
      toast({
        title: "Error", 
        description: "Please enter a valid OpenRouter API key (starts with sk-or-v1-)",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("openrouter_api_key", apiKey);
    toast({
      title: "Success",
      description: "API key saved successfully!",
    });
    onApiKeySet();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-primary">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-lg bg-card/80 border-border/50 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=200&h=80" 
                alt="GIG Logo" 
                className="h-16 w-auto"
              />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground animate-float">
                Welcome to OpenRouter AI 🚀
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Please enter your OpenRouter API key to access the document extraction solution
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="apikey" className="text-sm font-medium">
                  OpenRouter API Key
                </label>
                <div className="relative">
                  <Input
                    id="apikey"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                Save API Key
              </Button>
            </form>
            
            <div className="mt-4 text-xs text-muted-foreground">
              <p>Don't have an API key? Get one from <a href="https://openrouter.ai/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenRouter.ai</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};