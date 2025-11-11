import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";
import { Loader2, Image as ImageIcon, Eye, Download, ZoomIn, X } from "lucide-react";

interface ImageGeneratorProps {
  backendUrl: string;
  onToggleSidebar?: () => void;
}

export const ImageGenerator = ({ backendUrl, onToggleSidebar }: ImageGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState(512);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [mode] = useState<"text">("text");
  const [editImage] = useState<string | null>(null);
  const [analyzeImageUrl] = useState("");
  const [analysisResult] = useState<string | null>(null);
  const [analyzing] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string | null>(null);

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await toBase64(file);
    setEditImage(b64);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setImageUrl(null);
    try {
      const endpoint = "/images/generate";
      const body = { prompt, size };
      const res = await fetch(`${backendUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Handle different error types
        const errorMsg = data.error || "Failed to generate image";
        const details = data.details ? ` - ${data.details}` : "";
        throw new Error(`${errorMsg}${details}`);
      }
      
      setImageUrl(data.url || data.imageUrl || null);
      if (!data.url && !data.imageUrl) {
        setError("No image URL returned by server");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      console.error("Image generation error:", e);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnalyze = async () => {};

  const canSubmit = !!prompt;

  const handleDownloadImage = async (imageUrl: string, filename: string = "generated-image") => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      setError('Failed to download image');
    }
  };

  const handleViewFullImage = (imageUrl: string) => {
    setFullImageUrl(imageUrl);
    setShowFullImage(true);
  };

  const handleCloseFullImage = () => {
    setShowFullImage(false);
    setFullImageUrl(null);
  };

  // Handle ESC key to close full image modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showFullImage) {
        handleCloseFullImage();
      }
    };

    if (showFullImage) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset'; // Restore scrolling
    };
  }, [showFullImage]);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 gap-4">
      {/* Header with background (visible on all, compact on mobile) */}
      <div className="flex items-center justify-between px-2 py-2 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-9 w-9"
        >
          {/* using an inline svg to avoid adding new imports */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M3.75 6.75A.75.75 0 014.5 6h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25c0-.414.336-.75.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm.75 4.5a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15z" clipRule="evenodd" />
          </svg>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Image Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="img-prompt">Prompt</Label>
            <Input
              id="img-prompt"
              placeholder="Describe the image you want to create"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Size: {size}x{size}</Label>
            <Slider
              min={256}
              max={1024}
              step={64}
              value={[size]}
              onValueChange={(v) => setSize(v[0])}
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={!canSubmit || generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating
              </>
            ) : (
              "Generate Image"
            )}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      <div className="flex-1 min-h-0">
        {imageUrl ? (
          <div className="h-full w-full p-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Generated Image
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewFullImage(imageUrl)}
                    >
                      <ZoomIn className="h-4 w-4 mr-1" />
                      View Full
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadImage(imageUrl, "generated-image")}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="flex items-center justify-center p-4">
                    <img 
                      src={imageUrl} 
                      alt="Generated Result" 
                      className="max-h-full max-w-full rounded-md border shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleViewFullImage(imageUrl)}
                    />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground border rounded-md">
            Generated image will appear here
          </div>
        )}
      </div>

      {/* Full Image Modal */}
      {showFullImage && fullImageUrl && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleCloseFullImage}
        >
          <div 
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 text-white hover:bg-black/70"
              onClick={handleCloseFullImage}
            >
              <X className="h-6 w-6" />
            </Button>
            <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
              <ScrollArea className="max-h-[90vh] max-w-[90vw]">
                <img 
                  src={fullImageUrl} 
                  alt="Full Size" 
                  className="w-full h-auto"
                />
              </ScrollArea>
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Button
                variant="default"
                onClick={() => handleDownloadImage(fullImageUrl, "full-image")}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Full Image
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



