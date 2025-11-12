import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Loader2,
  Download,
  ZoomIn,
  Image as ImageIcon,
  Library,
  Trash2,
  ArrowLeft,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

type HistoryItem = {
  _id: string;
  prompt: string;
  imageUrl: string;
  sourceUrl?: string;
  model: string;
  createdAt: string;
};

type PromptCategory = {
  name: string;
  prompts: string[];
};

const PREDEFINED_PROMPTS: PromptCategory[] = [
  {
    name: "LinkedIn Post",
    prompts: [
      "Professional business meeting in modern office, diverse team collaborating, natural lighting, corporate photography style",
      "Successful business professional looking at laptop with growth charts, office background, inspirational mood, professional photography",
      "Team celebrating achievement with high-five, modern workplace, authentic emotions, corporate style",
      "Professional workspace with laptop, coffee, notebook and plants, minimalist aesthetic, top-down view, clean composition",
      "Business handshake in modern office, professional attire, partnership concept, natural window lighting",
    ],
  },
  {
    name: "Instagram Post",
    prompts: [
      "Aesthetic flat lay with coffee, flowers, and journal on pastel background, Instagram-worthy, soft natural light, trendy composition",
      "Vibrant sunset at tropical beach, palm trees silhouette, golden hour, dreamy atmosphere, travel photography style",
      "Minimalist lifestyle shot with plants and natural textures, bohemian aesthetic, warm tones, cozy vibes",
      "Fashion-forward outfit of the day, urban street background, trendy style, natural poses, lifestyle photography",
      "Delicious food photography, colorful healthy bowl, overhead shot, natural ingredients, appetizing presentation",
    ],
  },
  {
    name: "YouTube Thumbnail",
    prompts: [
      "Bold text 'AMAZING RESULTS' with shocked expression face, vibrant colors, high contrast, energetic composition, YouTube thumbnail style",
      "Split screen before and after comparison, dramatic lighting, bold arrows pointing, eye-catching colors, clickable thumbnail design",
      "Person pointing at floating question marks, surprised expression, bright background, dynamic composition, attention-grabbing style",
      "Exciting tech setup with glowing screens, futuristic vibe, neon accents, dramatic lighting, gaming or tech review aesthetic",
      "Money and success symbols floating around excited person, wealth concept, golden tones, motivational energy, finance thumbnail style",
    ],
  },
  {
    name: "Blog Header",
    prompts: [
      "Abstract modern geometric shapes in gradient colors, minimalist design, tech blog aesthetic, clean composition, wide banner format",
      "Cozy reading nook with books and warm lighting, literary atmosphere, inviting mood, lifestyle blog header style",
      "Fresh ingredients and cooking utensils on rustic wooden table, food blog aesthetic, natural lighting, appetizing composition",
      "Laptop with coffee on wooden desk, plants in background, productivity concept, blogger lifestyle, warm natural light",
      "Travel destination landscape, epic vista, adventure mood, wanderlust aesthetic, inspirational travel blog header",
    ],
  },
  {
    name: "Social Media Story",
    prompts: [
      "Vertical portrait format motivational quote design, pastel gradient background, elegant typography, Instagram story style",
      "Behind the scenes moment, authentic candid shot, personal touch, story-telling aesthetic, vertical format",
      "Product showcase on aesthetic background, lifestyle context, natural lighting, vertical composition, shopping inspiration",
      "Daily routine aesthetic moment, morning coffee or evening wind-down, cozy atmosphere, relatable content, story format",
      "Interactive poll or question sticker concept, colorful background, engaging design, fun and playful style, vertical story layout",
    ],
  },
];

export function ImageStudio({ backendUrl }: { backendUrl: string }) {
  const [prompt, setPrompt] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [size, setSize] = useState<number>(512);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const navigate = useNavigate();

  const canGenerate = useMemo(
    () => !!prompt && !generating,
    [prompt, generating]
  );

  const fetchHistory = async (reset = false) => {
    if (loadingHistory || (!hasMore && !reset)) return;
    setLoadingHistory(true);
    setError(null);
    try {
      const nextPage = reset ? 1 : page;
      const res = await fetch(
        `${backendUrl}/images/history?page=${nextPage}&limit=20`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch history");
      }
      setHistory(reset ? data.items : [...history, ...data.items]);
      setHasMore(data.hasMore);
      setPage(nextPage + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    // Initial history load
    fetchHistory(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);
    setImageUrl(null);
    try {
      const res = await fetch(`${backendUrl}/images/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt, size }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate image");
      }
      setImageUrl(data.imageUrl);
      // prepend to history
      setHistory((prev) => [
        { ...data, createdAt: data.createdAt || new Date().toISOString() },
        ...prev,
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (url: string, filename = "generated-image") => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = dlUrl;
      link.download = `${filename}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(dlUrl);
    } catch {
      setError("Failed to download image");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${backendUrl}/images/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setHistory((prev) => prev.filter((h) => h._id !== id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/writing")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Image Studio
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Generate Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Content Type (Optional)</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(v) => {
                    setSelectedCategory(v);
                    setPrompt(""); // Clear prompt when category changes
                  }}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Choose a content type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Custom Prompt</SelectItem>
                    {PREDEFINED_PROMPTS.map((category) => (
                      <SelectItem key={category.name} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCategory && selectedCategory !== "none" && (
                <div className="space-y-2">
                  <Label>Suggested Prompts</Label>
                  <ScrollArea className="h-40 border rounded-md p-2">
                    <div className="space-y-2">
                      {PREDEFINED_PROMPTS.find(
                        (cat) => cat.name === selectedCategory
                      )?.prompts.map((suggestedPrompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPrompt(suggestedPrompt)}
                          className="w-full text-left text-xs p-2 rounded border hover:bg-accent hover:border-primary transition-colors"
                        >
                          {suggestedPrompt}
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <textarea
                  id="prompt"
                  placeholder="A cozy reading nook by a window at sunset..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select
                  value={String(size)}
                  onValueChange={(v) => setSize(Number(v))}
                >
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Choose size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="512">512 px (fast)</SelectItem>
                    <SelectItem value="768">768 px (balanced)</SelectItem>
                    <SelectItem value="1024">1024 px (high detail)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </CardContent>
          </Card>

          {/* Result */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[420px] border rounded-md flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <div className="relative w-full h-full">
                    <img
                      src={imageUrl}
                      alt="Generated"
                      className="object-contain w-full h-full"
                    />
                    {generating && (
                      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex items-center gap-2 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(imageUrl, "_blank")}
                      >
                        <ZoomIn className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(imageUrl)}
                      >
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </div>
                    {prompt ? (
                      <div
                        className="absolute left-3 bottom-3 max-w-[80%] rounded-md bg-background/80 px-2 py-1 text-xs border truncate"
                        title={prompt}
                      >
                        {prompt}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Your generated image will appear here
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Library */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-5 w-5" /> Your Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="">
              {history.length === 0 ? (
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  No images yet. Generate your first one above.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {history.map((item) => (
                    <div
                      key={item._id}
                      className="group relative border rounded-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.prompt}
                        className="object-cover w-full h-56"
                      />
                      {/* Dark overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors" />
                      
                      {/* 3-dot menu - always visible */}
                      <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => window.open(item.imageUrl, "_blank")}
                            >
                              <ZoomIn className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleDownload(item.imageUrl, "library-image")
                              }
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(item._id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Date and prompt - only visible on hover */}
                      <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="space-y-2">
                          <div className="text-[10px] px-2 py-1 rounded bg-background/90 border w-fit">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                          <div
                            className="rounded bg-background/90 border px-2 py-1.5 text-xs leading-tight line-clamp-3"
                            title={item.prompt}
                          >
                            {item.prompt}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-center py-4">
                {hasMore ? (
                  <Button variant="outline" onClick={() => fetchHistory()}>
                    {loadingHistory ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Load more"
                    )}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No more items
                  </span>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
