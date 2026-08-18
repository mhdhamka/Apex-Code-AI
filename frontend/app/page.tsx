"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, Copy, Check, Terminal, Code2, Play, Sliders, Cpu, 
  Github, FileUp, History, Download, Printer, Trash2, X, BarChart3, FolderPlus,
  GitCompare, Settings2, Sparkles, MessageSquarePlus, ShieldAlert, AlertTriangle, CheckCircle2
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const REVIEW_TEMPLATES = [
  { id: "general", name: "General Architecture & Bugs", prompt: "Perform a senior-level architecture and bug analysis." },
  { id: "security", name: "Security & Vulnerabilities", prompt: "Focus heavily on security flaws, injection risks, authentication gaps, and data exposure." },
  { id: "performance", name: "Performance Optimization", prompt: "Analyze the code for performance bottlenecks, memory leaks, and scaling inefficiencies." },
];

interface HistoryItem {
  id: number;
  date: string;
  model: string;
  template: string;
  review: string;
}

interface BatchFile {
  name: string;
  content: string;
}

export default function CodeReviewPage() {
  const [inputMode, setInputMode] = useState<"manual" | "github" | "batch">("manual");
  const [code, setCode] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-3.6-flash");
  const [selectedTemplate, setSelectedTemplate] = useState(REVIEW_TEMPLATES[0].id);
  const [copied, setCopied] = useState(false);

  // History & Analytics drawer state
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // --- NEW FEATURE STATES ---
  const [viewMode, setViewMode] = useState<"review" | "diff">("review");
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [appliedSnippets, setAppliedSnippets] = useState<Record<number, boolean>>({});
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<"all" | "critical" | "security" | "performance">("all");
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [followUpMessages, setFollowUpMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("apex_review_history");
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  // VS Code Webview Environment Message Listener
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).acquireVsCodeApi) {
      window.addEventListener("message", (event) => {
        const message = event.data;
        switch (message.command) {
          case "loadCode":
            setInputMode("manual");
            setCode(message.code);
            break;
        }
      });
    }
  }, []);

  const saveToHistory = (reviewText: string) => {
    const newItem: HistoryItem = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      model: selectedModel,
      template: selectedTemplate,
      review: reviewText,
    };
    const updated = [newItem, ...history];
    setHistory(updated);
    localStorage.setItem("apex_review_history", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("apex_review_history");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setBatchFiles((prev) => [...prev, { name: file.name, content }]);
      };
      reader.readAsText(file);
    });
  };

  const removeBatchFile = (index: number) => {
    setBatchFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submitReview = async () => {
    setError("");
    let basePrompt = REVIEW_TEMPLATES.find((t) => t.id === selectedTemplate)?.prompt || "";
    if (customInstructions.trim()) {
      basePrompt += ` Additional Instructions: ${customInstructions.trim()}`;
    }

    let payloadBody: any = {
      model: selectedModel,
      template_prompt: basePrompt,
    };

    if (inputMode === "manual") {
      if (!code.trim()) { setError("Please enter some code or diff to review."); return; }
      payloadBody.code = code;
      payloadBody.is_diff = false;
    } else if (inputMode === "github") {
      if (!githubUrl.trim()) { setError("Please enter a valid GitHub PR URL."); return; }
      payloadBody.github_url = githubUrl;
    } else if (inputMode === "batch") {
      if (batchFiles.length === 0) { setError("Please upload at least one file for batch review."); return; }
      payloadBody.batch_files = batchFiles;
    }

    setLoading(true);
    setReview("");
    setFollowUpMessages([]);

    try {
      const endpoint = inputMode === "github" 
        ? "http://localhost:8000/review-github/" 
        : inputMode === "batch" 
        ? "http://localhost:8000/review-batch/" 
        : "http://localhost:8000/review/";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBody),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error || "Review failed");
      }

      const data = await res.json();
      const resultText = data.review || "No feedback returned.";
      setReview(resultText);
      saveToHistory(resultText);
    } catch (err: any) {
      setError(`⚠️ ${err.message || "Something went wrong. Please try again."}`);
    } finally {
      setLoading(false);
    }
  };

  const submitFollowUp = async () => {
    if (!followUpQuery.trim()) return;
    const userMsg = followUpQuery;
    setFollowUpQuery("");
    setFollowUpMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setFollowUpLoading(true);

    try {
      const res = await fetch("http://localhost:8000/review/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          code: code || "Context from previous review.",
          template_prompt: `Based on the previous code review, answer this follow-up query: ${userMsg}`,
        }),
      });
      const data = await res.json();
      setFollowUpMessages((prev) => [...prev, { role: "assistant", content: data.review || "No response." }]);
    } catch (err: any) {
      setFollowUpMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Failed to fetch follow-up response." }]);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const exportAsMarkdown = () => {
    const blob = new Blob([review], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `code-review-${Date.now()}.md`;
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(review);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to calculate a dynamic mock quality score based on length & keywords
  const calculateQualityScore = (text: string) => {
    if (!text) return { grade: "N/A", score: 0 };
    const issuesCount = (text.match(/bug|error|risk|vulnerability|warning/gi) || []).length;
    let score = Math.max(60, 95 - issuesCount * 3);
    let grade = "A";
    if (score < 70) grade = "C";
    else if (score < 80) grade = "B";
    else if (score < 90) grade = "B+";
    else grade = "A-";
    return { grade, score };
  };

  const { grade, score } = calculateQualityScore(review);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (!loading) submitReview();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, githubUrl, batchFiles, loading, selectedModel, selectedTemplate, inputMode, customInstructions]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-zinc-800 selection:text-zinc-100">
      {/* Top Navbar Header */}
      <header className="w-full border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shadow-sm">
            <Code2 size={18} />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-zinc-200">Apex Code AI</h1>
            <p className="text-xs text-zinc-500">Gemini Automated Code Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(true)}
            className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 text-xs h-8 px-3 rounded-lg border border-zinc-800 flex items-center gap-1.5"
          >
            <History size={14} /> History ({history.length})
          </Button>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            System Live
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-10 space-y-8">
        
        {/* Input Section Box */}
        <div className="relative rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl p-6 shadow-2xl space-y-5">
          
          {/* Controls Bar: Model & Template Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2 border-b border-zinc-800/60">
            <div className="flex items-center justify-between bg-zinc-950/60 border border-zinc-800/80 px-3.5 py-2 rounded-xl">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                <Cpu size={14} />
                <span>Model Engine</span>
              </div>
              <span className="text-zinc-200 text-xs font-medium font-mono">
                gemini-3.6-flash
              </span>
            </div>
            <div className="flex items-center justify-between bg-zinc-950/60 border border-zinc-800/80 px-3.5 py-2 rounded-xl">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
                <Sliders size={14} />
                <span>Review Focus</span>
              </div>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="bg-transparent text-zinc-200 text-xs font-medium focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                {REVIEW_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id} className="bg-zinc-950 text-zinc-200">
                    {tmpl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Feature 2: Advanced Settings Drawer Toggle */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 font-medium transition-colors"
            >
              <Settings2 size={13} />
              {showAdvancedSettings ? "Hide Advanced Settings" : "Configure Custom Prompt / System Instructions"}
            </button>
          </div>

          {/* Feature 2: Advanced Settings Drawer Content */}
          {showAdvancedSettings && (
            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-2 animate-fadeIn">
              <label className="text-xs font-medium text-zinc-300 block">Custom System Instructions / Rules Override</label>
              <Textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g., Strictly enforce TypeScript strict mode, verify Python 3.9 compatibility..."
                className="bg-zinc-900 border-zinc-800 text-xs font-mono text-zinc-200 resize-none h-20"
              />
            </div>
          )}

          {/* Input Mode Selector Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/80">
              <button
                onClick={() => setInputMode("manual")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${inputMode === "manual" ? "bg-zinc-800 text-zinc-100 shadow" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                Manual Snippet
              </button>
              <button
                onClick={() => setInputMode("github")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${inputMode === "github" ? "bg-zinc-800 text-zinc-100 shadow" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                <Github size={13} /> GitHub PR
              </button>
              <button
                onClick={() => setInputMode("batch")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${inputMode === "batch" ? "bg-zinc-800 text-zinc-100 shadow" : "text-zinc-400 hover:text-zinc-200"}`}
              >
                <FolderPlus size={13} /> Batch Files
              </button>
            </div>

            <span className="text-xs text-zinc-500 font-mono">Press Ctrl+Enter to Run</span>
          </div>

          {/* Dynamic Input Component Based on Mode */}
          {inputMode === "manual" && (
            <div className="relative">
              {/* Feature 1: Toggle between editor and Diff viewer if review exists */}
              <div className="flex items-center justify-end mb-2 gap-2">
                <button
                  onClick={() => setViewMode(viewMode === "review" ? "diff" : "review")}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800"
                >
                  <GitCompare size={12} />
                  {viewMode === "review" ? "View Diff Comparison" : "View Code Input"}
                </button>
              </div>

              {viewMode === "review" ? (
                <div className="relative">
                  <Textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="# Paste your code or configuration here..."
                    className="min-h-[260px] bg-zinc-950/80 border-zinc-800/80 text-zinc-200 font-mono text-sm rounded-xl focus-visible:ring-zinc-500/30 focus-visible:border-zinc-600 placeholder:text-zinc-600 resize-y p-4 shadow-inner"
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] font-mono text-zinc-600 pointer-events-none bg-zinc-900/80 px-2 py-1 rounded-md border border-zinc-800">
                    {code.length} chars
                  </div>
                </div>
              ) : (
                /* Feature 1: Side-by-side / Unified Diff Mode Simulation */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[260px]">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs overflow-auto">
                    <p className="text-zinc-500 pb-2 border-b border-zinc-900 mb-2">// Original Code / Base</p>
                    <pre className="text-zinc-400">{code || "// No code entered yet"}</pre>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs overflow-auto">
                    <p className="text-emerald-500 pb-2 border-b border-zinc-900 mb-2">// Proposed Changes / Suggestions</p>
                    <pre className="text-emerald-300">{review ? review.slice(0, 300) + "..." : "// Run review to see suggested updates"}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {inputMode === "github" && (
            <div className="space-y-3 py-6">
              <div className="flex items-center gap-3 bg-zinc-950/80 border border-zinc-800/80 rounded-xl px-4 py-3">
                <Github size={20} className="text-zinc-400 shrink-0" />
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo/pull/123"
                  className="w-full bg-transparent text-sm text-zinc-200 focus:outline-none placeholder:text-zinc-600 font-mono"
                />
              </div>
              <p className="text-xs text-zinc-500 pl-1">Make sure your backend has valid GitHub repository access permissions configured.</p>
            </div>
          )}

          {inputMode === "batch" && (
            <div className="space-y-4 py-4">
              <div className="relative border-2 border-dashed border-zinc-800 hover:border-zinc-700 transition-all rounded-2xl p-8 text-center bg-zinc-950/40">
                <FileUp className="mx-auto text-zinc-500 mb-2" size={28} />
                <p className="text-xs font-medium text-zinc-300">Drag & drop multiple files here, or click to browse</p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>

              {batchFiles.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-zinc-400">Uploaded Files ({batchFiles.length}):</p>
                  {batchFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-zinc-950/80 border border-zinc-800 px-3 py-2 rounded-lg text-xs font-mono">
                      <span className="text-zinc-300 truncate">{file.name}</span>
                      <button onClick={() => removeBatchFile(idx)} className="text-zinc-500 hover:text-red-400">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end pt-1">
            <Button
              onClick={submitReview}
              disabled={loading}
              className="bg-zinc-100 hover:bg-white text-zinc-950 font-medium rounded-xl px-6 py-2.5 transition-all shadow-lg shadow-black/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin text-zinc-950" size={16} /> Analyzing...
                </>
              ) : (
                <>
                  <Play size={14} className="fill-zinc-950 text-zinc-950" /> Run Code Review
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 backdrop-blur-md">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="rounded-2xl bg-zinc-900/20 border border-zinc-800/60 p-12 text-center space-y-3 backdrop-blur-md animate-pulse">
            <Loader2 className="animate-spin mx-auto text-zinc-400" size={32} />
            <p className="text-zinc-400 text-sm font-medium">Apex Code AI is analyzing code structures...</p>
          </div>
        )}

        {/* Output Review Box */}
        {review && !loading && (
          <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl p-6 md:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-4 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 text-zinc-200">
                  <Code2 size={18} className="text-zinc-400" />
                  <h2 className="font-semibold text-sm tracking-tight">Senior Engineer Assessment</h2>
                </div>
                {/* Feature 6: Quality Score Badge Widget */}
                <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded-full text-xs font-mono">
                  <Sparkles size={12} className="text-amber-400" />
                  <span className="text-zinc-400">Health:</span>
                  <span className="text-emerald-400 font-bold">{grade} ({score}%)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportAsMarkdown}
                  className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 text-xs h-8 px-2.5 rounded-lg flex items-center gap-1"
                >
                  <Download size={14} /> .md
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrint}
                  className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 text-xs h-8 px-2.5 rounded-lg flex items-center gap-1"
                >
                  <Printer size={14} /> PDF
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Feature 4: Severity Badges & Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-zinc-800/40 pb-3">
              <span className="text-xs text-zinc-500 font-medium mr-1">Filter Issues:</span>
              {(["all", "critical", "security", "performance"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedSeverityFilter(filter)}
                  className={`px-2.5 py-1 text-xs rounded-lg capitalize transition-colors ${selectedSeverityFilter === filter ? "bg-zinc-800 text-zinc-200 font-medium border border-zinc-700" : "text-zinc-400 hover:text-zinc-200 bg-zinc-950/40"}`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Review Content with Custom ReactMarkdown component to inject Feature 3 ("Apply Fix" buttons) */}
            <div className="text-zinc-300 text-sm space-y-4 leading-relaxed prose prose-invert max-w-none pt-2 font-sans">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    const codeString = String(children).replace(/\n$/, "");
                    const snippetIndex = Math.abs(codeString.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0));
                    const isApplied = appliedSnippets[snippetIndex];

                    if (!inline && match) {
                      return (
                        <div className="relative group my-4 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 text-xs font-mono text-zinc-400">
                            <span>{match[1].toUpperCase()} Suggestion</span>
                            {/* Feature 3: One-Click Apply Fix Button */}
                            <button
                              onClick={() => {
                                setAppliedSnippets((prev) => ({ ...prev, [snippetIndex]: true }));
                                setCode(codeString);
                                setViewMode("review");

                                if (typeof window !== "undefined" && (window as any).acquireVsCodeApi) {
                                  const vscode = (window as any).acquireVsCodeApi();
                                  vscode.postMessage({ command: "applyFix", code: codeString });
                                }
                              }}
                              className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${isApplied ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"}`}
                            >
                              {isApplied ? <CheckCircle2 size={13} /> : <Terminal size={13} />}
                              {isApplied ? "Applied!" : "Apply Fix"}
                            </button>
                          </div>
                          <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-200">
                            <code>{codeString}</code>
                          </pre>
                        </div>
                      );
                    }
                    return <code className={className} {...props}>{children}</code>;
                  }
                }}
              >
                {review}
              </ReactMarkdown>
            </div>

            {/* Feature 5: Interactive Follow-up Chat ("Ask AI about this review") */}
            <div className="border-t border-zinc-800/80 pt-6 mt-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <MessageSquarePlus size={15} className="text-zinc-400" />
                <span>Ask AI about this review</span>
              </div>

              {followUpMessages.length > 0 && (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {followUpMessages.map((msg, idx) => (
                    <div key={idx} className={`p-3 rounded-xl text-xs space-y-1 ${msg.role === "user" ? "bg-zinc-950/80 border border-zinc-800 ml-6" : "bg-zinc-900/60 border border-zinc-800/80 mr-6 text-zinc-300"}`}>
                      <p className="font-semibold text-[10px] text-zinc-500">{msg.role === "user" ? "You" : "Apex AI"}</p>
                      <p className="font-sans leading-relaxed">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {followUpLoading && (
                <div className="flex items-center gap-2 text-xs text-zinc-400 py-2 animate-pulse">
                  <Loader2 size={14} className="animate-spin" />
                  <span>Generating follow-up response...</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={followUpQuery}
                  onChange={(e) => setFollowUpQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitFollowUp(); }}
                  placeholder="e.g., Can you refactor this specific function using async/await instead?"
                  className="flex-1 bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600"
                />
                <Button
                  onClick={submitFollowUp}
                  disabled={followUpLoading || !followUpQuery.trim()}
                  size="sm"
                  className="bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium rounded-xl h-9 px-4 disabled:opacity-40"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* History & Analytics Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 p-6 flex flex-col justify-between h-full shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-zinc-400" />
                  <h3 className="text-sm font-semibold text-zinc-200">Review History & Analytics</h3>
                </div>
                <button onClick={() => setShowHistory(false)} className="text-zinc-400 hover:text-zinc-200">
                  <X size={18} />
                </button>
              </div>

              {/* Mini Stats Dashboard */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                    <BarChart3 size={13} /> Total Reviews
                  </div>
                  <p className="text-lg font-bold text-zinc-200">{history.length}</p>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-xl">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
                    <Cpu size={13} /> Default Engine
                  </div>
                  <p className="text-xs font-semibold text-emerald-400 truncate">{selectedModel}</p>
                </div>
              </div>

              {/* History Items list */}
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {history.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-10">No past reviews saved yet.</p>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => { setReview(item.review); setShowHistory(false); }}
                      className="bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 p-3.5 rounded-xl cursor-pointer transition-all space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{item.date}</span>
                        <span className="text-zinc-400 font-mono font-medium">{item.model}</span>
                      </div>
                      <p className="text-xs text-zinc-300 font-mono truncate">{item.review.replace(/[#*`]/g, "")}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {history.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                className="w-full text-red-400 border-red-900/40 hover:bg-red-950/30 text-xs h-9 rounded-xl flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Clear History
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Minimal Footer */}
      <footer className="w-full border-t border-zinc-900 py-4 text-center text-xs text-zinc-600">
        Apex Code AI System • Powered by Gemini AI
      </footer>
    </div>
  );
}
