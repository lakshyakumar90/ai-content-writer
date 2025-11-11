import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ScrollArea } from "./ui/scroll-area";
import { Loader2, UploadCloud, FileText, Trash2, Download, ArrowLeft } from "lucide-react";
import { Progress } from "./ui/progress";
import { useNavigate } from "react-router-dom";

type HistoryItem = {
  _id: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  analysis: {
    summary?: string;
    strengths?: string[];
    improvements?: string[];
    keywords?: string[];
    keywordMatches?: string[];
    missingKeywords?: string[];
    keywordCoveragePct?: number;
    atsScore?: number;
    yearsOfExperience?: number;
    readabilityScore?: number;
    seniority?: string;
    roleMatchScores?: Record<string, number>;
    sectionsQuality?: {
      summary?: number;
      experience?: number;
      education?: number;
      skills?: number;
    };
    skillsCategorized?: {
      technical?: string[];
      soft?: string[];
      tools?: string[];
    };
    educationSummary?: string[];
    certifications?: string[];
    suggestedRoles?: string[];
  };
  model: string;
  createdAt: string;
};

const ALLOWED = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
];

export function ResumeStudio({ backendUrl }: { backendUrl: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HistoryItem | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const fileOk = useMemo(() => {
    if (!file) return false;
    return ALLOWED.includes(file.type);
  }, [file]);

  useEffect(() => {
    fetchHistory(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPickFile = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setError("Unsupported file type. Upload PDF, DOCX, or an image.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
  };

  const fetchHistory = async (reset = false) => {
    if (loadingHistory || (!hasMore && !reset)) return;
    setLoadingHistory(true);
    try {
      const nextPage = reset ? 1 : page;
      const res = await fetch(`${backendUrl}/resume/history?page=${nextPage}&limit=20`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch history");
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

  const analyze = async () => {
    if (!file || !fileOk) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${backendUrl}/resume/analyze`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze resume");
      setResult(data);
      setHistory((prev) => [data, ...prev]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const removeFromHistory = async (id: string) => {
    try {
      const res = await fetch(`${backendUrl}/resume/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setHistory((prev) => prev.filter((h) => h._id !== id));
      if (result?._id === id) setResult(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    }
  };

  const download = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = dlUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(dlUrl);
    } catch {
      setError("Failed to download file");
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/dashboard/writing")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resume Studio
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Upload Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Supported: PDF, DOCX, PNG, JPG, WEBP (max 10MB)</Label>
                <div
                  className="border border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/40"
                  onClick={onPickFile}
                >
                  <UploadCloud className="h-6 w-6 mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">
                    {file ? (
                      <>
                        <div className="font-medium text-foreground">{file.name}</div>
                        <div className="text-xs">{file.type} • {(file.size / 1024).toFixed(1)} KB</div>
                      </>
                    ) : (
                      "Click to select a file"
                    )}
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={ALLOWED.join(",")}
                    onChange={onFileChange}
                  />
                </div>
              </div>
              <Button onClick={analyze} disabled={!fileOk || analyzing} className="w-full">
                {analyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing</> : "Analyze"}
              </Button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </CardContent>
          </Card>

          {/* Result */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[420px] border rounded-md overflow-hidden">
                {result ? (
                  <ScrollArea className="h-full p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm">
                        <div className="font-medium">{result.fileName}</div>
                        <div className="text-muted-foreground">{result.model}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(result.fileUrl, "_blank")}>
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => download(result.fileUrl, result.fileName)}>
                          <Download className="h-4 w-4 mr-1" /> Download
                        </Button>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="border rounded-md p-3">
                        <div className="text-xs text-muted-foreground mb-1">ATS Score</div>
                        <div className="text-2xl font-semibold">{Math.round(result.analysis?.atsScore || 0)}</div>
                        <Progress value={Math.min(100, Math.max(0, result.analysis?.atsScore || 0))} className="mt-2" />
                      </div>
                      <div className="border rounded-md p-3">
                        <div className="text-xs text-muted-foreground mb-1">Keyword Coverage</div>
                        <div className="text-2xl font-semibold">{Math.round(result.analysis?.keywordCoveragePct || 0)}%</div>
                        <Progress value={Math.min(100, Math.max(0, result.analysis?.keywordCoveragePct || 0))} className="mt-2" />
                      </div>
                      <div className="border rounded-md p-3">
                        <div className="text-xs text-muted-foreground mb-1">Experience</div>
                        <div className="text-2xl font-semibold">{result.analysis?.yearsOfExperience ?? 0} yrs</div>
                        <div className="text-xs text-muted-foreground mt-2">{result.analysis?.seniority || "N/A"}</div>
                      </div>
                      <div className="border rounded-md p-3">
                        <div className="text-xs text-muted-foreground mb-1">Readability</div>
                        <div className="text-2xl font-semibold">{Math.round(result.analysis?.readabilityScore || 0)}</div>
                        <Progress value={Math.min(100, Math.max(0, result.analysis?.readabilityScore || 0))} className="mt-2" />
                      </div>
                    </div>

                    {/* Sections Quality */}
                    {result.analysis?.sectionsQuality && (
                      <section className="mb-4">
                        <h3 className="font-semibold mb-2">Section Quality</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(result.analysis.sectionsQuality).map(([k, v]) => (
                            <div key={k} className="border rounded-md p-3">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="capitalize">{k}</span>
                                <span>{Math.round(v || 0)}</span>
                              </div>
                              <Progress value={Math.min(100, Math.max(0, v || 0))} />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Role Match Scores */}
                    {result.analysis?.roleMatchScores && (
                      <section className="mb-4">
                        <h3 className="font-semibold mb-2">Role Match Scores</h3>
                        <div className="space-y-2">
                          {Object.entries(result.analysis.roleMatchScores)
                            .sort((a, b) => (b[1] || 0) - (a[1] || 0))
                            .map(([role, score]) => (
                              <div key={role} className="border rounded-md p-3">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>{role}</span>
                                  <span>{Math.round(score || 0)}</span>
                                </div>
                                <Progress value={Math.min(100, Math.max(0, score || 0))} />
                              </div>
                            ))}
                        </div>
                      </section>
                    )}

                    {/* Keywords */}
                    {(result.analysis?.keywordMatches?.length || result.analysis?.missingKeywords?.length || result.analysis?.keywords?.length) ? (
                      <section className="mb-4">
                        <h3 className="font-semibold mb-2">Keywords</h3>
                        {result.analysis?.keywordMatches?.length ? (
                          <>
                            <div className="text-xs text-muted-foreground mb-1">Matched</div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {result.analysis.keywordMatches!.map((k, i) => (
                                <span key={`m-${i}`} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{k}</span>
                              ))}
                            </div>
                          </>
                        ) : null}
                        {result.analysis?.missingKeywords?.length ? (
                          <>
                            <div className="text-xs text-muted-foreground mb-1">Missing</div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {result.analysis.missingKeywords!.map((k, i) => (
                                <span key={`x-${i}`} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">{k}</span>
                              ))}
                            </div>
                          </>
                        ) : null}
                        {result.analysis?.keywords?.length ? (
                          <>
                            <div className="text-xs text-muted-foreground mb-1">All Suggested</div>
                            <div className="flex flex-wrap gap-2">
                              {result.analysis.keywords!.map((k, i) => (
                                <span key={`k-${i}`} className="text-xs bg-muted px-2 py-1 rounded">{k}</span>
                              ))}
                            </div>
                          </>
                        ) : null}
                      </section>
                    ) : null}

                    {/* Skills */}
                    {result.analysis?.skillsCategorized && (
                      <section className="mb-4">
                        <h3 className="font-semibold mb-2">Skills</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {["technical", "soft", "tools"].map((cat) => (
                            <div key={cat} className="border rounded-md p-3">
                              <div className="text-sm font-medium capitalize mb-2">{cat}</div>
                              <div className="flex flex-wrap gap-2">
                                {(result.analysis!.skillsCategorized as any)[cat]?.map((s: string, i: number) => (
                                  <span key={`${cat}-${i}`} className="text-xs bg-muted px-2 py-1 rounded">{s}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Education & Certs */}
                    {(result.analysis?.educationSummary?.length || result.analysis?.certifications?.length) ? (
                      <section className="mb-4">
                        <h3 className="font-semibold mb-2">Education & Certifications</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {result.analysis?.educationSummary?.length ? (
                            <div className="border rounded-md p-3">
                              <div className="text-sm font-medium mb-2">Education</div>
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                {result.analysis.educationSummary.map((e, i) => <li key={`edu-${i}`}>{e}</li>)}
                              </ul>
                            </div>
                          ) : null}
                          {result.analysis?.certifications?.length ? (
                            <div className="border rounded-md p-3">
                              <div className="text-sm font-medium mb-2">Certifications</div>
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                {result.analysis.certifications.map((c, i) => <li key={`cert-${i}`}>{c}</li>)}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      </section>
                    ) : null}

                    {/* Narrative Sections */}
                    {result.analysis?.summary && (
                      <section className="mb-4">
                        <h3 className="font-semibold mb-2">Summary</h3>
                        <p className="text-sm leading-6">{result.analysis.summary}</p>
                      </section>
                    )}
                    {result.analysis?.strengths?.length ? (
                      <section className="mb-4">
                        <h3 className="font-semibold mb-2">Strengths</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {result.analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </section>
                    ) : null}
                    {result.analysis?.improvements?.length ? (
                      <section className="mb-4">
                        <h3 className="font-semibold mb-2">Improvement Suggestions</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {result.analysis.improvements.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </section>
                    ) : null}
                    {result.analysis?.suggestedRoles?.length ? (
                      <section className="mb-4">
                        <h3 className="font-semibold mb-2">Suggested Roles</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {result.analysis.suggestedRoles.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </section>
                    ) : null}
                  </ScrollArea>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    Upload a resume and click Analyze to see results
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Your Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[420px]">
              {history.length === 0 ? (
                <div className="h-[380px] flex items-center justify-center text-sm text-muted-foreground">
                  No analyses yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.map((item) => (
                    <div key={item._id} className="border rounded-md p-3">
                      <div className="flex justify-between items-start">
                        <div className="text-sm">
                          <div className="font-medium truncate max-w-[220px]" title={item.fileName}>
                            {item.fileName}
                          </div>
                          <div className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setResult(item)}>
                            View
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => removeFromHistory(item._id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground truncate">
                        {item.analysis?.summary || "No summary"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-center py-4">
                {hasMore ? (
                  <Button variant="outline" onClick={() => fetchHistory()}>
                    {loadingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">No more items</span>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


