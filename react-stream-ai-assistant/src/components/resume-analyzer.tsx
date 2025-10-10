import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FileText, Loader2 } from "lucide-react";

interface ResumeAnalyzerProps {
  backendUrl: string;
  onToggleSidebar?: () => void;
}

export const ResumeAnalyzer = ({ backendUrl, onToggleSidebar }: ResumeAnalyzerProps) => {
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      // Placeholder: call your backend when available
      // Expecting endpoint like `${backendUrl}/resume/analyze`
      const res = await fetch(`${backendUrl}/resume/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resume: resumeText }),
      });
      if (!res.ok) throw new Error("Failed to analyze resume");
      const data = await res.json();
      setAnalysis(data.analysis || data.result || "No insights returned");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M3.75 6.75A.75.75 0 014.5 6h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm0 5.25c0-.414.336-.75.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75zm.75 4.5a.75.75 0 000 1.5h15a.75.75 0 000-1.5h-15z" clipRule="evenodd" />
          </svg>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Resume Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resume-text">Paste your resume</Label>
            <Textarea
              id="resume-text"
              placeholder="Paste your resume content here to get actionable feedback"
              className="min-h-[160px]"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>
          <Button onClick={handleAnalyze} disabled={!resumeText || loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing
              </>
            ) : (
              "Analyze Resume"
            )}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      <div className="flex-1 min-h-0">
        {analysis ? (
          <div className="h-full w-full p-4 border rounded-md overflow-auto text-sm whitespace-pre-wrap">
            {analysis}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground border rounded-md">
            Analysis will appear here
          </div>
        )}
      </div>
    </div>
  );
};



