import { useState } from "react";
import { Upload, FileText, Image, Sparkles, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardProps {
  onFileUpload: (file: File) => void;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onBackToHome?: () => void;
}

export const Dashboard = ({ 
  onFileUpload, 
  isDragOver, 
  onDragOver, 
  onDragLeave, 
  onDrop,
  onBackToHome
}: DashboardProps) => {
  const [showGreeting, setShowGreeting] = useState(true);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary p-4">
      <div className="max-w-4xl mx-auto">
        {/* Back to Home Button */}
        {onBackToHome && (
          <div className="mb-6 animate-slide-in-up">
            <Button
              onClick={onBackToHome}
              variant="outline"
              className="bg-background/10 border-border/30 text-foreground hover:bg-background/20 transition-all duration-300"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        )}
        {/* Animated Title */}
        <div className="text-center mb-12 animate-slide-in-up">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 animate-float">
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Oracle Cloud Document Field Extraction Solution
            </span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground/80 mb-4">
            Thanks Hafeez for logging in
          </h2>
          <div className="flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary mr-2 animate-pulse-glow" />
            <Sparkles className="h-4 w-4 text-accent mr-1" />
            <Sparkles className="h-6 w-6 text-primary ml-2 animate-pulse-glow" />
          </div>
        </div>

        {/* Upload Section */}
        <Card className="backdrop-blur-lg bg-card/80 border-border/50 shadow-2xl animate-glow animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
          <CardContent className="p-8">
            <div
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                isDragOver
                  ? "border-primary bg-primary/10 scale-105"
                  : "border-border/50 hover:border-primary/50 hover:bg-accent/5"
              }`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="relative">
                    <Upload className="h-16 w-16 text-primary animate-float" />
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="h-6 w-6 text-accent animate-pulse-glow" />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-foreground">
                    Upload Your Document
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    Drag and drop your file here or click to browse
                  </p>
                </div>

                <div className="flex justify-center">
                  <label htmlFor="file-upload">
                    <Button
                      type="button"
                      className="bg-gradient-accent hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-glow px-8 py-3 text-lg"
                      asChild
                    >
                      <span>
                        <Upload className="h-5 w-5 mr-2" />
                        Choose File
                      </span>
                    </Button>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Image className="h-4 w-4 text-primary" />
                    <span>Images</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span>PDFs</span>
                  </div>
                  <span className="text-primary">Max 5MB • Drag & Drop Supported</span>
                </div>
              </div>

              {isDragOver && (
                <div className="absolute inset-0 bg-primary/20 rounded-xl flex items-center justify-center">
                  <p className="text-2xl font-semibold text-primary animate-pulse">
                    Drop your file here! ✨
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};