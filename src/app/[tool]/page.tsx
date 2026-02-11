"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { FileUpload } from "@/components/features/FileUpload";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { processFile } from "@/lib/mockApi";
import {
  Loader2,
  CheckCircle,
  Download,
  ArrowLeft,
  Trash2,
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

  const [files, setFiles] = useState<File[]>([]);
  const [splitRange, setSplitRange] = useState("");
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<
    "extreme" | "recommended" | "less"
  >("recommended");

  if (!tool) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold text-foreground">Tool Not Found</h1>
        <Link href="/">
          <Button variant="outline" className="mt-4">
            Go Home
          </Button>
        </Link>
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
    setDownloadUrl(null); // Reset download URL on new file selection
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    if (newFiles.length === 0) {
      setStatus("idle");
      setDownloadUrl(null);
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
      const result = await processFile(
        isMergeTool ? files : files[0],
        tool.title,
        {
          range: isSplitTool ? splitRange : undefined,
          compressionLevel,
        },
      );

      if (result.success) {
        setDownloadUrl(result.url);
        setStatus("success");
      } else {
        setStatus("error");
        alert(result.message);
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-transparent">
      <div className="mx-auto max-w-3xl text-center mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {tool.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{tool.description}</p>
      </div>

      <div className="mx-auto max-w-2xl">
        <Card className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-slate-900/50 border border-slate-800 shadow-2xl backdrop-blur-sm">
          {status === "idle" && (files.length === 0 || isMergeTool) && (
            <FileUpload
              onFileSelect={handleFileSelect}
              multiple={isMergeTool}
              accept={tool.accept}
              className={
                files.length > 0
                  ? "min-h-[200px] border-dashed border-slate-700 bg-slate-800/50"
                  : ""
              }
            />
          )}

          {status === "idle" && files.length > 0 && (
            <div className="w-full space-y-6">
              <div className="space-y-3 max-h-[300px] overflow-y-auto w-full px-2 scrollbar-thin scrollbar-thumb-slate-700">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700 group hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="p-2 bg-slate-900 rounded-md border border-slate-700">
                        <span className="text-xs font-bold text-slate-400">
                          PDF
                        </span>
                      </div>
                      <span className="text-sm font-medium text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-slate-500 hover:text-red-500 p-1 rounded-md hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {isSplitTool && (
                <div className="bg-blue-950/20 p-4 rounded-lg border border-blue-900/50">
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Page Range to Extract
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1-5, 8, 11-13"
                    value={splitRange}
                    onChange={(e) => setSplitRange(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-blue-900/50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200"
                  />
                  <p className="text-xs text-blue-400 mt-2">
                    Enter page numbers or ranges separated by commas.
                  </p>
                </div>
              )}

              {(toolKey === "compress-pdf" || toolKey === "compress-image") && (
                <div className="bg-pink-950/20 p-4 rounded-lg border border-pink-900/50">
                  <label className="block text-sm font-medium text-pink-200 mb-3 text-center">
                    Choose Compression Level
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
                        onClick={() => setCompressionLevel(level.id as any)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-md border transition-all",
                          compressionLevel === level.id
                            ? "bg-pink-600 border-pink-700 text-white shadow-sm"
                            : "bg-slate-900 border-pink-900/50 text-pink-400 hover:bg-pink-900/20",
                        )}
                      >
                        <span className="text-xs font-bold">{level.label}</span>
                        <span
                          className={cn(
                            "text-[10px]",
                            compressionLevel === level.id
                              ? "text-pink-100"
                              : "text-pink-500",
                          )}
                        >
                          {level.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-pink-400 mt-2 text-center">
                    {compressionLevel === "extreme" &&
                      "Smallest file size, lower image quality."}
                    {compressionLevel === "recommended" &&
                      "Optimal balance between size and quality."}
                    {compressionLevel === "less" &&
                      "Best quality, larger file size."}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 border-t border-slate-800">
                {isMergeTool && files.length < 2 ? (
                  <p className="text-sm text-amber-500 bg-amber-950/30 px-3 py-1 rounded-full border border-amber-900/50">
                    Select at least 2 files to merge
                  </p>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleProcess}
                    className={cn(
                      "w-full sm:w-auto min-w-[200px] text-lg py-6 shadow-lg hover:shadow-xl transition-all border-0",
                      "bg-gradient-brand text-white shadow-rose-500/20 hover:shadow-rose-500/40",
                    )}
                  >
                    {tool.action}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={() => {
                    setFiles([]);
                    setSplitRange("");
                  }}
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {status === "processing" && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-lg font-medium text-foreground">
                Processing {files.length}{" "}
                {files.length === 1 ? "File" : "Files"}...
              </p>
            </div>
          )}

          {status === "success" && downloadUrl && (
            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-center">
                <div className="rounded-full bg-green-900/30 p-3 border border-green-900/50">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {tool.title} Successful!
              </h3>
              <div className="flex gap-4 justify-center flex-wrap">
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
                    className="gap-2 bg-gradient-brand text-white border-0 shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40"
                  >
                    <Download className="h-5 w-5" /> Download{" "}
                    {toolKey === "compress-image" || toolKey === "pdf-to-image"
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
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Process Another
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
