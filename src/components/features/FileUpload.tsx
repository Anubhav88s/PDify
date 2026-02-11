"use client";

import React, { useState, useCallback } from "react";
import { UploadCloud, FileType } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function FileUpload({
  onFileSelect,
  accept = ".pdf",
  multiple = false,
  className,
}: {
  onFileSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      const pdfFiles = droppedFiles.filter(
        (file) => file.type === "application/pdf",
      );

      if (pdfFiles.length > 0) {
        if (!multiple && pdfFiles.length > 1) {
          onFileSelect([pdfFiles[0]]);
        } else {
          onFileSelect(pdfFiles);
        }
      } else {
        alert("Please upload PDF files.");
      }
    },
    [onFileSelect, multiple],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (selectedFiles.length > 0) {
        onFileSelect(selectedFiles);
      }
    },
    [onFileSelect],
  );

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full min-h-[400px] border-2 border-dashed rounded-xl transition-all duration-300 bg-slate-900/20 backdrop-blur-sm",
        isDragOver
          ? "border-primary bg-primary/10 shadow-[0_0_30px_rgba(225,29,72,0.15)]"
          : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/30",
        className,
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="p-4 bg-gradient-brand rounded-full shadow-lg shadow-rose-500/20">
          <FileType className="w-12 h-12 text-white" />
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-foreground">
            Select PDF {multiple ? "files" : "file"}
          </p>
          <p className="text-muted-foreground">
            or drop PDF {multiple ? "files" : "file"} here
          </p>
        </div>

        <label htmlFor="file-upload" className="cursor-pointer mt-4">
          <div
            className={cn(
              "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
              "bg-primary text-primary-foreground shadow hover:bg-primary/90",
              "h-10 px-8 py-2",
              "shadow-lg shadow-primary/20",
            )}
          >
            Select PDF {multiple ? "files" : "file"}
          </div>
        </label>
        <input
          id="file-upload"
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    </div>
  );
}
