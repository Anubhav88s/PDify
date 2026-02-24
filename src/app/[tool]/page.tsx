"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { FileUpload } from "@/components/features/FileUpload";
import { Button } from "@/components/ui/Button";
import { processFile } from "@/lib/mockApi";
import { summarizePdf, type SummarizeMode } from "@/lib/services/summarizePdf";
import { useAuth } from "@/lib/AuthContext";
import {
  Loader2,
  CheckCircle,
  Download,
  ArrowLeft,
  Trash2,
  RotateCcw,
  Lock,
  Sparkles,
  Copy,
  Check,
  BookOpen,
  GraduationCap,
  Layers,
  ScanSearch,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { toolsConfig } from "@/lib/tools";

export default function ToolPage() {
  const params = useParams();
  const toolKey = params.tool as string;
  const tool = toolsConfig[toolKey];
  const isMergeTool = toolKey === "merge-pdf";
  const isSplitTool = toolKey === "split-pdf";
  const isSummarizeTool = toolKey === "summarize-pdf";

  const { user, loading: authLoading } = useAuth();

  const [files, setFiles] = useState<File[]>([]);
  const [splitRange, setSplitRange] = useState("");
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<
    "extreme" | "recommended" | "less"
  >("recommended");
  const [summarizeMode, setSummarizeMode] = useState<SummarizeMode>("standard");
  const [usedOcr, setUsedOcr] = useState(false);

  if (!tool) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <h1 className="text-2xl font-bold text-white">Tool Not Found</h1>
        </div>
        <Link href="/">
          <Button variant="outline">← Go Home</Button>
        </Link>
      </div>
    );
  }

  // Auth gate for protected tools
  if (tool.requiresAuth && !authLoading && !user) {
    return (
      <div className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-transparent">
        <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-20" />
        <div className="mx-auto max-w-2xl animate-fade-up">
          <div className="text-center mb-10">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-slate-500 hover:text-white mb-6 transition-colors duration-200 group"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {tool.title}
            </h1>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-8 sm:p-12 shadow-2xl shadow-black/20 text-center">
            <div className="inline-flex p-5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/15 mb-6">
              <Lock className="h-10 w-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Sign In Required
            </h2>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">
              This AI-powered tool requires you to be signed in. Create a free
              account to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/login">
                <Button
                  size="lg"
                  className="w-full sm:w-auto min-w-[160px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] rounded-xl"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto min-w-[160px] rounded-xl"
                >
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleFileSelect = (selectedFiles: File[]) => {
    if (isMergeTool) {
      setFiles((prev) => [...prev, ...selectedFiles]);
    } else {
      setFiles(selectedFiles);
    }
    setStatus("idle");
    setDownloadUrl(null);
    setSummaryText("");
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    if (newFiles.length === 0) {
      setStatus("idle");
      setDownloadUrl(null);
      setSummaryText("");
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) return;
    if (isSplitTool && !splitRange.trim()) {
      alert("Please enter a page range (e.g., 1-5, 8)");
      return;
    }

    setStatus("processing");
    try {
      if (isSummarizeTool) {
        const result = await summarizePdf(files[0], summarizeMode);
        if (result.success) {
          setSummaryText(result.summary);
          setUsedOcr(result.usedOcr);
          setStatus("success");
        } else {
          setStatus("error");
          alert(result.message);
        }
      } else {
        const result = await processFile(
          tool.title,
          isMergeTool ? files : files[0],
          {
            range: isSplitTool ? splitRange : undefined,
            compressionLevel,
          }
        );

        if (result.success) {
          setDownloadUrl(result.url);
          setStatus("success");
        } else {
          setStatus("error");
          alert(result.message);
        }
      }
    } catch {
      setStatus("error");
    }
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = summaryText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-transparent">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-20" />

      {/* Header */}
      <div className="mx-auto max-w-3xl text-center mb-10 animate-fade-up">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-500 hover:text-white mb-6 transition-colors duration-200 group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />{" "}
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {tool.title}
          {isSummarizeTool && (
            <Sparkles className="inline-block ml-3 h-8 w-8 text-emerald-400" />
          )}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-400">
          {tool.description}
        </p>
      </div>

      {/* Main Card */}
      <div
        className={cn(
          "mx-auto animate-fade-up animation-delay-100",
          isSummarizeTool && status === "success" ? "max-w-4xl" : "max-w-2xl"
        )}
      >
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-6 sm:p-8 shadow-2xl shadow-black/20 min-h-[420px] flex flex-col items-center justify-center">
          {/* Upload state */}
          {status === "idle" && (files.length === 0 || isMergeTool) && (
            <FileUpload
              onFileSelect={handleFileSelect}
              multiple={isMergeTool}
              accept={tool.accept}
              fileLabel={tool.fileLabel}
              className={
                files.length > 0
                  ? "min-h-[180px] border-slate-700/40 bg-white/[0.01]"
                  : ""
              }
            />
          )}

          {/* Files selected */}
          {status === "idle" && files.length > 0 && (
            <div className="w-full space-y-6">
              {/* File list */}
              <div className="space-y-2 max-h-[280px] overflow-y-auto w-full px-1">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-3.5 bg-white/[0.03] rounded-xl border border-white/[0.06] group hover:border-blue-500/20 hover:bg-white/[0.04] transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="flex-shrink-0 p-2 bg-gradient-to-br from-blue-500/10 to-violet-500/10 rounded-lg border border-white/[0.06]">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                          {file.name.split(".").pop() || "FILE"}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <span className="text-sm font-medium text-slate-200 truncate block max-w-[200px] sm:max-w-xs">
                          {file.name}
                        </span>
                        <span className="text-xs text-slate-600">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="flex-shrink-0 text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Split range input */}
              {isSplitTool && (
                <div className="bg-blue-500/[0.04] p-4 rounded-xl border border-blue-500/10">
                  <label className="block text-sm font-medium text-blue-300 mb-2">
                    Page Range to Extract
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1-5, 8, 11-13"
                    value={splitRange}
                    onChange={(e) => setSplitRange(e.target.value)}
                    className="w-full p-2.5 bg-slate-950/80 border border-blue-500/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-slate-200 text-sm placeholder:text-slate-600 transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Enter page numbers or ranges separated by commas.
                  </p>
                </div>
              )}

              {/* Summarize Mode Selector */}
              {isSummarizeTool && (
                <div className="bg-emerald-500/[0.04] p-4 rounded-xl border border-emerald-500/10">
                  <label className="block text-sm font-medium text-emerald-300 mb-3 text-center">
                    Summarization Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: "standard" as SummarizeMode,
                        label: "Standard",
                        sub: "Overview",
                        icon: BookOpen,
                      },
                      {
                        id: "exam" as SummarizeMode,
                        label: "Exam Mode",
                        sub: "Study & Q&A",
                        icon: GraduationCap,
                      },
                      {
                        id: "chapter" as SummarizeMode,
                        label: "Chapters",
                        sub: "By Section",
                        icon: Layers,
                      },
                    ].map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          onClick={() => setSummarizeMode(m.id)}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 gap-1",
                            summarizeMode === m.id
                              ? "bg-gradient-to-br from-emerald-600 to-teal-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                              : "bg-white/[0.02] border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/[0.06] hover:border-emerald-500/20"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-xs font-bold">
                            {m.label}
                          </span>
                          <span
                            className={cn(
                              "text-[10px]",
                              summarizeMode === m.id
                                ? "text-emerald-200"
                                : "text-emerald-600"
                            )}
                          >
                            {m.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 text-center">
                    {summarizeMode === "standard" &&
                      "Concise overview with key points and takeaways."}
                    {summarizeMode === "exam" &&
                      "Definitions, core concepts, and practice questions for revision."}
                    {summarizeMode === "chapter" &&
                      "Section-by-section breakdown of the document."}
                  </p>
                </div>
              )}

              {/* Compression level */}
              {(toolKey === "compress-pdf" ||
                toolKey === "compress-image") && (
                <div className="bg-violet-500/[0.04] p-4 rounded-xl border border-violet-500/10">
                  <label className="block text-sm font-medium text-violet-300 mb-3 text-center">
                    Compression Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "extreme", label: "Extreme", sub: "Pro" },
                      {
                        id: "recommended",
                        label: "Recommended",
                        sub: "Balanced",
                      },
                      { id: "less", label: "Less", sub: "Quality" },
                    ].map((level) => (
                      <button
                        key={level.id}
                        onClick={() =>
                          setCompressionLevel(level.id as any)
                        }
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200",
                          compressionLevel === level.id
                            ? "bg-gradient-to-br from-violet-600 to-indigo-600 border-violet-500 text-white shadow-lg shadow-violet-500/20"
                            : "bg-white/[0.02] border-violet-500/10 text-violet-400 hover:bg-violet-500/[0.06] hover:border-violet-500/20"
                        )}
                      >
                        <span className="text-xs font-bold">
                          {level.label}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] mt-0.5",
                            compressionLevel === level.id
                              ? "text-violet-200"
                              : "text-violet-600"
                          )}
                        >
                          {level.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 text-center">
                    {compressionLevel === "extreme" &&
                      "Smallest file size, lower image quality."}
                    {compressionLevel === "recommended" &&
                      "Optimal balance between size and quality."}
                    {compressionLevel === "less" &&
                      "Best quality, larger file size."}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4 border-t border-white/[0.04]">
                {isMergeTool && files.length < 2 ? (
                  <p className="text-sm text-amber-400/80 bg-amber-500/[0.06] px-4 py-2 rounded-full border border-amber-500/10">
                    Select at least 2 files to merge
                  </p>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleProcess}
                    className={cn(
                      "w-full sm:w-auto min-w-[200px] text-base py-6 text-white shadow-xl border-0 rounded-xl shimmer",
                      isSummarizeTool
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02]"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02]"
                    )}
                  >
                    {isSummarizeTool && (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {tool.action}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={() => {
                    setFiles([]);
                    setSplitRange("");
                    setSummaryText("");
                    setUsedOcr(false);
                  }}
                  className="text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Processing state */}
          {status === "processing" && (
            <div className="text-center space-y-5 py-8">
              <div className="relative inline-flex">
                <div
                  className={cn(
                    "absolute inset-0 rounded-full blur-xl animate-pulse",
                    isSummarizeTool
                      ? "bg-emerald-500/20"
                      : "bg-blue-500/20"
                  )}
                />
                <Loader2
                  className={cn(
                    "relative h-14 w-14 animate-spin",
                    isSummarizeTool ? "text-emerald-400" : "text-blue-400"
                  )}
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
                  {isSummarizeTool
                    ? summarizeMode === "exam"
                      ? "Generating study material..."
                      : summarizeMode === "chapter"
                        ? "Analyzing document structure..."
                        : "AI is analyzing your document..."
                    : `Processing ${
                        files.length === 1
                          ? "your file"
                          : `${files.length} files`
                      }...`}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {isSummarizeTool
                    ? summarizeMode === "exam"
                      ? "Extracting definitions, concepts & creating practice questions"
                      : summarizeMode === "chapter"
                        ? "Detecting sections and summarizing each chapter"
                        : "Extracting text and generating summary"
                    : "This may take a moment"}
                </p>
              </div>
            </div>
          )}

          {/* Success state - Summary display */}
          {status === "success" && isSummarizeTool && summaryText && (
            <div className="w-full space-y-5 animate-fade-up">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-lg border",
                    summarizeMode === "exam"
                      ? "bg-amber-500/10 border-amber-500/20"
                      : summarizeMode === "chapter"
                        ? "bg-blue-500/10 border-blue-500/20"
                        : "bg-emerald-500/10 border-emerald-500/20"
                  )}>
                    {summarizeMode === "exam" ? (
                      <GraduationCap className="h-5 w-5 text-amber-400" />
                    ) : summarizeMode === "chapter" ? (
                      <Layers className="h-5 w-5 text-blue-400" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {summarizeMode === "exam"
                        ? "Exam Study Material"
                        : summarizeMode === "chapter"
                          ? "Chapter Breakdown"
                          : "AI Summary"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Powered by Gemini
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {usedOcr && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-full">
                      <ScanSearch className="h-3.5 w-3.5" />
                      OCR Vision Used
                    </span>
                  )}
                  <button
                    onClick={handleCopySummary}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-all duration-200"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Mode badge */}
              <div className="flex gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border",
                  summarizeMode === "exam"
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    : summarizeMode === "chapter"
                      ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                )}>
                  {summarizeMode === "exam" && <><GraduationCap className="h-3 w-3" /> Exam Mode</>}
                  {summarizeMode === "chapter" && <><Layers className="h-3 w-3" /> Chapter Breakdown</>}
                  {summarizeMode === "standard" && <><BookOpen className="h-3 w-3" /> Standard Summary</>}
                </span>
              </div>

              <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-6 max-h-[600px] overflow-y-auto prose prose-invert prose-sm max-w-none">
                <div
                  className="text-slate-300 leading-relaxed whitespace-pre-wrap"
                  style={{ fontSize: "0.9rem" }}
                >
                  {summaryText}
                </div>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setFiles([]);
                    setStatus("idle");
                    setDownloadUrl(null);
                    setSummaryText("");
                    setSplitRange("");
                    setUsedOcr(false);
                  }}
                  className="rounded-xl gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Summarize Another
                </Button>
              </div>
            </div>
          )}

          {/* Success state - Download (non-summarize tools) */}
          {status === "success" && !isSummarizeTool && downloadUrl && (
            <div className="text-center space-y-7 py-4 animate-fade-up">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl animate-pulse" />
                  <div className="relative rounded-full bg-green-500/10 p-4 border border-green-500/20">
                    <CheckCircle className="h-12 w-12 text-green-400" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">
                  {tool.title} Complete!
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Your file is ready for download
                </p>
              </div>

              <div className="flex gap-3 justify-center flex-wrap">
                <a
                  href={downloadUrl}
                  download={`processed-${files[0]?.name.replace(/\.[^/.]+$/, "")}${
                    toolKey === "compress-image"
                      ? `.${files[0]?.name.split(".").pop()}`
                      : toolKey === "pdf-to-image"
                        ? ".jpg"
                        : toolKey === "pdf-to-ppt"
                          ? ".pptx"
                          : toolKey === "pdf-to-doc"
                            ? ".docx"
                            : ".pdf"
                  }`}
                >
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 rounded-xl shimmer"
                  >
                    <Download className="h-5 w-5" />
                    Download{" "}
                    {toolKey === "compress-image" ||
                    toolKey === "pdf-to-image"
                      ? "Image"
                      : toolKey === "pdf-to-ppt"
                        ? "PPT"
                        : toolKey === "pdf-to-doc"
                          ? "Word"
                          : "PDF"}
                  </Button>
                </a>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setFiles([]);
                    setStatus("idle");
                    setDownloadUrl(null);
                    setSplitRange("");
                  }}
                  className="rounded-xl gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Process Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
